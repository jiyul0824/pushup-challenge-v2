import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { runOnJS } from "react-native-reanimated";

// ─────────────────────────────────────────────────────────────
// Native ML 모듈 안전 로딩
// react-native-nitro-modules 는 모듈 평가 시점에 TurboModuleRegistry.
// getEnforcing() 를 실행한다. 네이티브 빌드에 포함되지 않았을 때 throw 하면
// start.tsx 자체가 import 실패 → 탭 라우트가 등록되지 않는 문제를 방지하기
// 위해 dynamic require + try-catch IIFE 로 로딩한다.
// ─────────────────────────────────────────────────────────────
type TflitePlugin =
  | { state: "loading"; model: undefined }
  | { state: "loaded";  model: { runSync(i: ArrayBuffer[]): ArrayBuffer[] } }
  | { state: "error";   model: undefined; error: Error };

const { useTFModel, boxModel, resizePlugin } = (() => {
  try {
    const tflite  = require("react-native-fast-tflite") as { useTensorflowModel: (src: ReturnType<typeof require>) => TflitePlugin };
    const nitro   = require("react-native-nitro-modules") as { NitroModules: { box(m: unknown): { unbox(): { runSync(i: ArrayBuffer[]): ArrayBuffer[] } } } };
    const resize  = require("vision-camera-resize-plugin") as { useResizePlugin(): { resize: (frame: unknown, opts: unknown) => Uint8Array } };
    return {
      useTFModel:   tflite.useTensorflowModel,
      boxModel:     (m: unknown) => nitro.NitroModules.box(m),
      resizePlugin: resize.useResizePlugin,
    };
  } catch (e) {
    console.warn("[start] ML 네이티브 모듈 불가 – 직접 시작하기만 동작합니다:", e);
    return {
      useTFModel:   (_: unknown): TflitePlugin => ({ state: "error", model: undefined, error: e as Error }),
      boxModel:     (_: unknown) => null,
      resizePlugin: () => ({ resize: () => new Uint8Array(0) }),
    };
  }
})();

// ─────────────────────────────────────────────────────────────

const GREEN  = "#00C853";
const ORANGE = "#f97316";
const BG     = "#0a0a0a";

type Phase     = "WAITING" | "READY" | "COUNTDOWN" | "COUNTING" | "DONE";
type PoseState = "UP" | "DOWN" | "NONE";

// MoveNet keypoint 인덱스 (COCO 순서)
const IDX_LS = 5, IDX_RS = 6;
const IDX_LE = 7, IDX_RE = 8;
const IDX_LW = 9, IDX_RW = 10;

function calcAngle(
  ax: number, ay: number,
  bx: number, by: number,
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

export default function StartTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");

  const [phase,      setPhase]      = useState<Phase>("WAITING");
  const [countdown,  setCountdown]  = useState(3);
  const [count,      setCount]      = useState(0);
  const [poseState,  setPoseState]  = useState<PoseState>("NONE");
  const [elbowAngle, setElbowAngle] = useState(180);
  const [debugText,  setDebugText]  = useState("카메라 분석 중...");

  const phaseRef     = useRef<Phase>("WAITING");
  const poseStateRef = useRef<PoseState>("NONE");
  const countRef     = useRef(0);

  const pulse      = useRef(new Animated.Value(1)).current;
  const countScale = useRef(new Animated.Value(1)).current;

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

  const bounceCount = useCallback(() => {
    Animated.sequence([
      Animated.timing(countScale, { toValue: 1.4, duration: 80, useNativeDriver: true }),
      Animated.spring(countScale, { toValue: 1,   useNativeDriver: true, damping: 5, stiffness: 300 }),
    ]).start();
  }, [countScale]);

  // ── MoveNet 모델 (안전 로딩) ──
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const plugin = useTFModel(require("../../assets/models/movenet_lightning.tflite"));

  // ── boxedModel: worklet 스레드 접근용 ──
  const boxedModel = useMemo(() => {
    if (plugin.state !== "loaded") return null;
    try { return boxModel(plugin.model); }
    catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin.state]);

  // ── resize plugin (안전 로딩) ──
  const { resize } = resizePlugin();

  // ── 수동 시작 ──
  const startManually = useCallback(() => {
    if (phaseRef.current !== "WAITING") return;
    phaseRef.current = "READY";
    setPhase("READY");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // ── pose 콜백 (JS 스레드) ──
  const onPoseData = useCallback(
    (visibleCount: number, maxScore: number, lAngle: number, rAngle: number) => {
      const elbow = Math.min(lAngle, rAngle);
      setElbowAngle(Math.round(elbow));

      if (phaseRef.current === "WAITING") {
        setDebugText(
          visibleCount === 0
            ? "인식 없음 — 카메라와 1~2m 거리에서 정면을 보세요"
            : `신체 감지됨 (${visibleCount}개 포인트, 신뢰도 ${Math.round(maxScore * 100)}%)`
        );
        if (visibleCount >= 2 && maxScore > 0.25) {
          phaseRef.current = "READY";
          setPhase("READY");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return;
      }

      if (phaseRef.current !== "COUNTING") return;

      if (elbow < 90 && poseStateRef.current !== "DOWN") {
        poseStateRef.current = "DOWN";
        setPoseState("DOWN");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (elbow > 160 && poseStateRef.current === "DOWN") {
        poseStateRef.current = "UP";
        setPoseState("UP");
        countRef.current += 1;
        setCount(countRef.current);
        bounceCount();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    [bounceCount]
  );

  // ── 프레임 프로세서 ──
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (boxedModel == null) return;

      const resized = resize(frame, {
        scale: { width: 192, height: 192 },
        pixelFormat: "rgb",
        dataType: "uint8",
      });

      const inputBuffer = (resized as Uint8Array).buffer.slice(
        (resized as Uint8Array).byteOffset,
        (resized as Uint8Array).byteOffset + (resized as Uint8Array).byteLength
      );

      const tflite  = (boxedModel as { unbox(): { runSync(i: ArrayBuffer[]): ArrayBuffer[] } }).unbox();
      const outputs = tflite.runSync([inputBuffer as ArrayBuffer]);

      const raw = outputs[0];
      if (raw == null) return;
      const kps = new Float32Array(raw);

      const score = (i: number) => kps[i * 3 + 2];
      const kx    = (i: number) => kps[i * 3 + 1];
      const ky    = (i: number) => kps[i * 3];

      let visibleCount = 0, maxScore = 0;
      for (let i = 0; i < 17; i++) {
        const s = score(i);
        if (s > 0.20) visibleCount++;
        if (s > maxScore) maxScore = s;
      }

      const ARM = 0.25;
      const lOk = score(IDX_LS) > ARM && score(IDX_LE) > ARM && score(IDX_LW) > ARM;
      const rOk = score(IDX_RS) > ARM && score(IDX_RE) > ARM && score(IDX_RW) > ARM;

      const lAngle = lOk ? calcAngle(kx(IDX_LS), ky(IDX_LS), kx(IDX_LE), ky(IDX_LE), kx(IDX_LW), ky(IDX_LW)) : 180;
      const rAngle = rOk ? calcAngle(kx(IDX_RS), ky(IDX_RS), kx(IDX_RE), ky(IDX_RE), kx(IDX_RW), ky(IDX_RW)) : 180;

      runOnJS(onPoseData)(visibleCount, maxScore, lAngle, rAngle);
    },
    [boxedModel, resize, onPoseData]
  );

  // READY → COUNTDOWN
  useEffect(() => {
    if (phase !== "READY") return;
    const t = setTimeout(() => { phaseRef.current = "COUNTDOWN"; setPhase("COUNTDOWN"); setCountdown(3); }, 1200);
    return () => clearTimeout(t);
  }, [phase]);

  // COUNTDOWN → COUNTING
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
    const t = setTimeout(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCountdown((n) => n - 1); }, 1000);
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

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={phase !== "DONE" && boxedModel != null ? frameProcessor : undefined}
        pixelFormat="yuv"
      />
      <View style={styles.overlay} />

      {/* ── WAITING ── */}
      {phase === "WAITING" && (
        <>
          <View style={[styles.topSection, { paddingTop: insets.top + 32 }]}>
            <Text style={styles.guideText}>카메라에서 1~2m 거리에서{"\n"}상체가 보이도록 서주세요</Text>
          </View>
          <View style={styles.middleSection}>
            <View style={styles.circleOuter}>
              <Animated.View style={[styles.circleInner, { opacity: pulse }]} />
            </View>
            {plugin.state === "loading" && <Text style={styles.modelLoadText}>⏳ AI 모델 준비 중...</Text>}
            {plugin.state === "error"   && <Text style={styles.modelErrorText}>⚠ 자동 감지 불가 — 직접 시작하기를 눌러주세요</Text>}
            {plugin.state === "loaded"  && <Text style={styles.debugText}>{debugText}</Text>}
          </View>
          <View style={[styles.manualStartWrap, { paddingBottom: insets.bottom + 100 }]}>
            <Pressable
              style={({ pressed }) => [styles.manualStartBtn, pressed && { opacity: 0.8 }]}
              onPress={startManually}
            >
              <Text style={styles.manualStartText}>직접 시작하기</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ── READY ── */}
      {phase === "READY" && (
        <View style={styles.middleSection}>
          <Text style={styles.bigEmoji}>✅</Text>
          <Text style={styles.readyText}>준비 완료!</Text>
          <Text style={styles.subText}>잠시 후 카운팅이 시작됩니다</Text>
        </View>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === "COUNTDOWN" && (
        <View style={styles.middleSection}>
          <Text style={styles.countdownNum}>{countdown}</Text>
          <Text style={styles.subText}>준비하세요!</Text>
        </View>
      )}

      {/* ── COUNTING ── */}
      {phase === "COUNTING" && (
        <>
          <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
            <View style={[
              styles.stateBadge,
              poseState === "DOWN"
                ? { backgroundColor: "rgba(249,115,22,0.18)", borderColor: ORANGE }
                : { backgroundColor: "rgba(0,200,83,0.18)",   borderColor: GREEN  },
            ]}>
              <Text style={[styles.stateText, { color: poseState === "DOWN" ? ORANGE : GREEN }]}>
                {poseState === "DOWN" ? "⬇  DOWN" : poseState === "UP" ? "⬆  UP" : "시작!"}
              </Text>
            </View>
            <Text style={styles.angleText}>팔꿈치 각도  {elbowAngle}°</Text>
          </View>
          <View style={styles.middleSection}>
            <Animated.Text style={[styles.bigCount, { transform: [{ scale: countScale }] }]}>
              {count}
            </Animated.Text>
            <Text style={styles.bigCountUnit}>개</Text>
          </View>
        </>
      )}

      {/* ── DONE ── */}
      {phase === "DONE" && (
        <View style={styles.middleSection}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>완료!</Text>
          <Text style={styles.doneCount}>{count}</Text>
          <Text style={styles.doneCountUnit}>개</Text>
          <Text style={styles.subText}>오늘도 수고했어요!</Text>
        </View>
      )}

      {/* ── 하단 버튼 ── */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {phase === "COUNTING" && (
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); phaseRef.current = "DONE"; setPhase("DONE"); }}
          >
            <Text style={styles.doneBtnText}>완료 ({count}개)</Text>
          </Pressable>
        )}
        {phase === "DONE" ? (
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.replace("/(tabs)/home"); }}
          >
            <Text style={styles.doneBtnText}>홈으로 돌아가기</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  center:  { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },

  topSection:    { alignItems: "center", paddingHorizontal: 24, gap: 10 },
  middleSection: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  bottomSection: { alignItems: "center", gap: 12, paddingHorizontal: 24 },

  guideText: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center", letterSpacing: 0.3 },

  circleOuter:    { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: GREEN, alignItems: "center", justifyContent: "center" },
  circleInner:    { width: 90,  height: 90,  borderRadius: 45, backgroundColor: GREEN },
  modelLoadText:  { color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "500" },
  modelErrorText: { color: "rgba(255,200,0,0.85)", fontSize: 12, fontWeight: "600", textAlign: "center", paddingHorizontal: 24 },
  debugText:      { color: "rgba(255,255,255,0.5)",  fontSize: 12, fontWeight: "500", textAlign: "center", paddingHorizontal: 24 },

  manualStartWrap: { paddingHorizontal: 32, width: "100%" },
  manualStartBtn:  { borderWidth: 1.5, borderColor: GREEN, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  manualStartText: { color: GREEN, fontSize: 15, fontWeight: "700" },

  bigEmoji:  { fontSize: 72 },
  readyText: { color: "#fff", fontSize: 32, fontWeight: "900" },
  subText:   { color: "rgba(255,255,255,0.65)", fontSize: 15, fontWeight: "500" },

  countdownNum: {
    color: GREEN, fontSize: 130, fontWeight: "900",
    lineHeight: 140, letterSpacing: -4,
    textShadowColor: "rgba(0,200,83,0.5)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
  },

  stateBadge: { borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 28, paddingVertical: 10 },
  stateText:  { fontSize: 20, fontWeight: "800", letterSpacing: 0.5 },
  angleText:  { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  bigCount: {
    color: "#fff", fontSize: 150, fontWeight: "900",
    lineHeight: 160, letterSpacing: -5,
    textShadowColor: "rgba(255,255,255,0.15)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  bigCountUnit: { color: "rgba(255,255,255,0.55)", fontSize: 36, fontWeight: "700", marginTop: -20 },

  doneTitle:     { color: "#fff", fontSize: 42, fontWeight: "900" },
  doneCount:     { color: GREEN, fontSize: 90, fontWeight: "900", lineHeight: 100, letterSpacing: -3 },
  doneCountUnit: { color: "rgba(0,200,83,0.7)", fontSize: 28, fontWeight: "700", marginTop: -12 },

  doneBtn:     { backgroundColor: GREEN, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 48, width: "100%", alignItems: "center" },
  doneBtnText: { color: "#000", fontSize: 17, fontWeight: "800" },
  cancelBtn:   { paddingVertical: 14, paddingHorizontal: 48, borderRadius: 30, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
  cancelText:  { color: "#fff", fontSize: 16, fontWeight: "600" },

  permText:    { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  permBtn:     { backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  permBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
