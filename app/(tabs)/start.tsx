import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { useTensorflowModel } from "react-native-fast-tflite";
import { runOnJS } from "react-native-reanimated";

const GREEN  = "#00C853";
const ORANGE = "#f97316";
const BG     = "#0a0a0a";

// ─── 상태 타입 ───
type Phase     = "WAITING" | "READY" | "COUNTDOWN" | "COUNTING" | "DONE";
type PoseState = "UP" | "DOWN" | "NONE";

// ─── MoveNet keypoint 인덱스 (COCO 순서) ───
// 5=L.Shoulder  6=R.Shoulder  7=L.Elbow  8=R.Elbow  9=L.Wrist  10=R.Wrist
const IDX_LS = 5, IDX_RS = 6;
const IDX_LE = 7, IDX_RE = 8;
const IDX_LW = 9, IDX_RW = 10;

// ─── 세 점으로 각도 계산 (worklet에서 사용) ───
function calcAngle(
  ax: number, ay: number,
  bx: number, by: number, // 꼭짓점 (팔꿈치)
  cx: number, cy: number,
): number {
  "worklet";
  const ux = ax - bx, uy = ay - by;
  const vx = cx - bx, vy = cy - by;
  const dot = ux * vx + uy * vy;
  const mag = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
  if (mag < 1e-8) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

// ─────────────────────────────────────────
export default function StartTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");

  // ── 상태 ──
  const [phase,      setPhase]      = useState<Phase>("WAITING");
  const [countdown,  setCountdown]  = useState(3);
  const [count,      setCount]      = useState(0);
  const [poseState,  setPoseState]  = useState<PoseState>("NONE");
  const [elbowAngle, setElbowAngle] = useState(180);

  // worklet → JS 간 stale closure 방지용 ref
  const phaseRef     = useRef<Phase>("WAITING");
  const poseStateRef = useRef<PoseState>("NONE");
  const countRef     = useRef(0);

  // ── 애니메이션 ──
  const pulse      = useRef(new Animated.Value(1)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  // 대기 중 펄스
  useEffect(() => {
    if (phase !== "WAITING") return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.15, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [phase, pulse]);

  // 카운트 바운스
  const bouncCount = useCallback(() => {
    Animated.sequence([
      Animated.timing(countScale,  { toValue: 1.4, duration: 80,  useNativeDriver: true }),
      Animated.spring(countScale,  { toValue: 1,   useNativeDriver: true, damping: 5, stiffness: 300 }),
    ]).start();
  }, [countScale]);

  // ── MoveNet 모델 로드 ──
  const model = useTensorflowModel(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../../assets/models/movenet_lightning.tflite")
  );

  // ── 프레임 처리 결과 → JS 스레드 콜백 ──
  const onPoseData = useCallback(
    (handDetected: boolean, lAngle: number, rAngle: number) => {
      // 두 팔 중 더 굽혀진(낮은) 각도를 기준으로 사용
      const elbow = Math.min(lAngle, rAngle);
      setElbowAngle(Math.round(elbow));

      // ① WAITING: 손이 감지되면 → READY
      if (phaseRef.current === "WAITING" && handDetected) {
        phaseRef.current = "READY";
        setPhase("READY");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      // ② COUNTING: 팔꿈치 각도로 UP/DOWN 판정
      if (phaseRef.current !== "COUNTING") return;

      if (elbow < 90 && poseStateRef.current !== "DOWN") {
        // DOWN 상태 진입
        poseStateRef.current = "DOWN";
        setPoseState("DOWN");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (elbow > 160 && poseStateRef.current === "DOWN") {
        // DOWN → UP: 푸쉬업 1회 완성
        poseStateRef.current = "UP";
        setPoseState("UP");
        countRef.current += 1;
        setCount(countRef.current);
        bouncCount();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    [bouncCount]
  );

  // ── 프레임 프로세서 (카메라 스레드 / worklet) ──
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (model.state !== "loaded") return;

      // MoveNet 추론: 출력 shape [1,1,17,3] → Float32Array 51개 값
      const outputs = model.model.runSync([frame]);
      const kps = outputs[0] as Float32Array;

      // 헬퍼: keypoint 인덱스 → score / x / y (값 범위 0~1)
      const score = (i: number) => kps[i * 3 + 2];
      const kx    = (i: number) => kps[i * 3 + 1];
      const ky    = (i: number) => kps[i * 3];

      const CONF = 0.35; // 최소 신뢰도 임계값
      const HAND = 0.55; // 손 감지 임계값

      const lOk = score(IDX_LS) > CONF && score(IDX_LE) > CONF && score(IDX_LW) > CONF;
      const rOk = score(IDX_RS) > CONF && score(IDX_RE) > CONF && score(IDX_RW) > CONF;

      // 왼쪽/오른쪽 팔꿈치 각도 계산
      const lAngle = lOk
        ? calcAngle(kx(IDX_LS), ky(IDX_LS), kx(IDX_LE), ky(IDX_LE), kx(IDX_LW), ky(IDX_LW))
        : 180;
      const rAngle = rOk
        ? calcAngle(kx(IDX_RS), ky(IDX_RS), kx(IDX_RE), ky(IDX_RE), kx(IDX_RW), ky(IDX_RW))
        : 180;

      // 손목이 충분히 명확하면 '손 감지'로 간주
      const handDetected = score(IDX_LW) > HAND || score(IDX_RW) > HAND;

      runOnJS(onPoseData)(handDetected, lAngle, rAngle);
    },
    [model, onPoseData]
  );

  // ── READY → COUNTDOWN (1.2초 후) ──
  useEffect(() => {
    if (phase !== "READY") return;
    const t = setTimeout(() => {
      phaseRef.current = "COUNTDOWN";
      setPhase("COUNTDOWN");
      setCountdown(3);
    }, 1200);
    return () => clearTimeout(t);
  }, [phase]);

  // ── COUNTDOWN 1초마다 감소 → COUNTING ──
  useEffect(() => {
    if (phase !== "COUNTDOWN") return;
    if (countdown <= 0) {
      phaseRef.current = "COUNTING";
      poseStateRef.current = "NONE";
      countRef.current = 0;
      setPhase("COUNTING");
      setPoseState("NONE");
      setCount(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const t = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCountdown((n) => n - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // ──────────────────── 렌더 ────────────────────

  if (!hasPermission) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Text style={styles.permText}>카메라 접근 권한이 필요합니다</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>권한 허용하기</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar style="light" />
        <Text style={styles.permText}>전면 카메라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />

      {/* ── 카메라 (전체 화면) ── */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={phase !== "DONE" ? frameProcessor : undefined}
        pixelFormat="rgb"
      />
      <View style={styles.overlay} />

      {/* ────────── WAITING ────────── */}
      {phase === "WAITING" && (
        <>
          <View style={[styles.topSection, { paddingTop: insets.top + 48 }]}>
            <Text style={styles.guideText}>손바닥을 카메라에 보여주세요</Text>
          </View>
          <View style={styles.middleSection}>
            <View style={styles.circleOuter}>
              <Animated.View style={[styles.circleInner, { opacity: pulse }]} />
            </View>
            <Text style={styles.waitingText}>손바닥 인식 대기 중...</Text>
            {model.state === "loading" && (
              <Text style={styles.modelLoadText}>⏳ AI 모델 준비 중...</Text>
            )}
            {model.state === "error" && (
              <Text style={styles.modelErrorText}>⚠ 모델 로딩 실패</Text>
            )}
          </View>
        </>
      )}

      {/* ────────── READY ────────── */}
      {phase === "READY" && (
        <View style={styles.middleSection}>
          <Text style={styles.bigEmoji}>✅</Text>
          <Text style={styles.readyText}>준비 완료!</Text>
          <Text style={styles.subText}>잠시 후 카운팅이 시작됩니다</Text>
        </View>
      )}

      {/* ────────── COUNTDOWN ────────── */}
      {phase === "COUNTDOWN" && (
        <View style={styles.middleSection}>
          <Text style={styles.countdownNum}>{countdown}</Text>
          <Text style={styles.subText}>준비하세요!</Text>
        </View>
      )}

      {/* ────────── COUNTING ────────── */}
      {phase === "COUNTING" && (
        <>
          <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
            {/* 상태 배지 */}
            <View style={[
              styles.stateBadge,
              poseState === "DOWN"
                ? { backgroundColor: "rgba(249,115,22,0.18)", borderColor: ORANGE }
                : { backgroundColor: "rgba(0,200,83,0.18)",   borderColor: GREEN  },
            ]}>
              <Text style={[
                styles.stateText,
                { color: poseState === "DOWN" ? ORANGE : GREEN },
              ]}>
                {poseState === "DOWN" ? "⬇  DOWN" : poseState === "UP" ? "⬆  UP" : "시작!"}
              </Text>
            </View>
            {/* 팔꿈치 각도 표시 */}
            <Text style={styles.angleText}>팔꿈치 각도  {elbowAngle}°</Text>
          </View>

          {/* 카운트 숫자 */}
          <View style={styles.middleSection}>
            <Animated.Text
              style={[styles.bigCount, { transform: [{ scale: countScale }] }]}
            >
              {count}
            </Animated.Text>
            <Text style={styles.bigCountUnit}>개</Text>
          </View>
        </>
      )}

      {/* ────────── DONE ────────── */}
      {phase === "DONE" && (
        <View style={styles.middleSection}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>완료!</Text>
          <Text style={styles.doneCount}>{count}</Text>
          <Text style={styles.doneCountUnit}>개</Text>
          <Text style={styles.subText}>오늘도 수고했어요!</Text>
        </View>
      )}

      {/* ────────── 하단 버튼 ────────── */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {/* 카운팅 중 → 완료 버튼 */}
        {phase === "COUNTING" && (
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              phaseRef.current = "DONE";
              setPhase("DONE");
            }}
          >
            <Text style={styles.doneBtnText}>완료 ({count}개)</Text>
          </Pressable>
        )}

        {/* DONE → 홈 버튼 / 그 외 → 취소 버튼 */}
        {phase === "DONE" ? (
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace("/(tabs)/home");
            }}
          >
            <Text style={styles.doneBtnText}>홈으로 돌아가기</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  center:  { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },

  /* 레이아웃 섹션 */
  topSection:    { alignItems: "center", paddingHorizontal: 24, gap: 10 },
  middleSection: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  bottomSection: { alignItems: "center", gap: 12, paddingHorizontal: 24 },

  /* 가이드 */
  guideText: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center", letterSpacing: 0.3 },

  /* WAITING */
  circleOuter:    { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: GREEN, alignItems: "center", justifyContent: "center" },
  circleInner:    { width: 90, height: 90, borderRadius: 45, backgroundColor: GREEN },
  waitingText:    { color: GREEN, fontSize: 14, fontWeight: "600", letterSpacing: 0.5 },
  modelLoadText:  { color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "500" },
  modelErrorText: { color: "#ff3b30", fontSize: 12, fontWeight: "600" },

  /* READY */
  bigEmoji:  { fontSize: 72 },
  readyText: { color: "#fff", fontSize: 32, fontWeight: "900" },
  subText:   { color: "rgba(255,255,255,0.65)", fontSize: 15, fontWeight: "500" },

  /* COUNTDOWN */
  countdownNum: {
    color: GREEN, fontSize: 130, fontWeight: "900",
    lineHeight: 140, letterSpacing: -4,
    textShadowColor: "rgba(0,200,83,0.5)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
  },

  /* COUNTING */
  stateBadge: { borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 28, paddingVertical: 10 },
  stateText:  { fontSize: 20, fontWeight: "800", letterSpacing: 0.5 },
  angleText:  { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  bigCount: {
    color: "#fff", fontSize: 150, fontWeight: "900",
    lineHeight: 160, letterSpacing: -5,
    textShadowColor: "rgba(255,255,255,0.15)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  bigCountUnit: { color: "rgba(255,255,255,0.55)", fontSize: 36, fontWeight: "700", marginTop: -20 },

  /* DONE */
  doneTitle:     { color: "#fff", fontSize: 42, fontWeight: "900" },
  doneCount:     { color: GREEN, fontSize: 90, fontWeight: "900", lineHeight: 100, letterSpacing: -3 },
  doneCountUnit: { color: "rgba(0,200,83,0.7)", fontSize: 28, fontWeight: "700", marginTop: -12 },

  /* 버튼 */
  doneBtn:     { backgroundColor: GREEN, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 48, width: "100%", alignItems: "center" },
  doneBtnText: { color: "#000", fontSize: 17, fontWeight: "800" },
  cancelBtn:   { paddingVertical: 14, paddingHorizontal: 48, borderRadius: 30, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
  cancelText:  { color: "#fff", fontSize: 16, fontWeight: "600" },

  /* 권한 */
  permText:    { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  permBtn:     { backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  permBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
