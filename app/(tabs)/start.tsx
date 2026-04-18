import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#0a0a0a";
const GREEN = "#00C853";

export default function StartTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Text style={styles.permissionText}>카메라 접근 권한이 필요합니다</Text>
        <Pressable style={styles.permissionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); requestPermission(); }}>
          <Text style={styles.permissionBtnText}>권한 허용하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />

      <CameraView style={StyleSheet.absoluteFill} facing="front" />

      {/* 어두운 오버레이 */}
      <View style={styles.overlay} />

      {/* 상단 안내 텍스트 */}
      <View style={[styles.topSection, { paddingTop: insets.top + 48 }]}>
        <Text style={styles.guideText}>손바닥을 카메라에 보여주세요</Text>
      </View>

      {/* 가운데 인식 애니메이션 */}
      <View style={styles.middleSection}>
        <View style={styles.circleOuter}>
          <Animated.View style={[styles.circleInner, { opacity: pulse }]} />
        </View>
        <Text style={styles.waitingText}>손바닥 인식 대기 중...</Text>
      </View>

      {/* 하단 취소 버튼 */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
        >
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  topSection: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  guideText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  middleSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  circleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: GREEN,
  },
  waitingText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bottomSection: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  cancelText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
  permissionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  permissionBtn: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
