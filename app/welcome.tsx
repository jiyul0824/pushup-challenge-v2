import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/theme";

const GREEN = "#00C853";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // 마스코트 흔들기 애니메이션
  const waveRot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveRot, { toValue: 1,  duration: 300, useNativeDriver: true }),
        Animated.timing(waveRot, { toValue: -1, duration: 300, useNativeDriver: true }),
        Animated.timing(waveRot, { toValue: 1,  duration: 300, useNativeDriver: true }),
        Animated.timing(waveRot, { toValue: 0,  duration: 300, useNativeDriver: true }),
        Animated.delay(1400),
      ])
    ).start();
  }, []);
  const rotate = waveRot.interpolate({ inputRange: [-1, 1], outputRange: ["-14deg", "14deg"] });

  return (
    <View style={[styles.container, {
      backgroundColor: colors.bg,
      paddingTop: insets.top,
      paddingBottom: Math.max(insets.bottom, 24),
    }]}>
      <StatusBar style="light" />

      {/* 뒤로가기 */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={16} color={colors.subtext} />
      </Pressable>

      {/* 중앙: 말풍선 + 마스코트 */}
      <View style={styles.center}>

        {/* 말풍선 */}
        <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bubbleText, { color: colors.text }]}>
            {"안녕하세요!\n함께 더 강해지는\n도전을 시작해봐요!"}
          </Text>
          {/* 아래 화살표 꼬리 */}
          <View style={styles.tailWrap}>
            <View style={[styles.tailOuter, { borderTopColor: colors.border }]} />
            <View style={[styles.tailInner, { borderTopColor: colors.card }]} />
          </View>
        </View>

        {/* 마스코트 아바타 */}
        <Animated.View style={[styles.mascotOuter, {
          backgroundColor: `${GREEN}18`,
          borderColor: `${GREEN}40`,
          transform: [{ rotate }],
        }]}>
          <View style={[styles.mascotInner, { backgroundColor: GREEN }]}>
            <FontAwesome name="user" size={58} color="#fff" />
          </View>
        </Animated.View>

      </View>

      {/* 시작 버튼 */}
      <Pressable
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.88 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/login");
        }}
      >
        <Text style={styles.btnText}>시작하기</Text>
        <FontAwesome name="arrow-right" size={16} color="#000" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },

  backBtn: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    marginTop: 8,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    marginBottom: 16,
  },

  /* 말풍선 */
  bubble: {
    borderRadius: 22,
    borderWidth: 1.5,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: "center",
    marginBottom: 4,
    width: "100%",
  },
  bubbleText: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 30,
    textAlign: "center",
  },
  tailWrap: {
    position: "absolute",
    bottom: -15,
    left: 0, right: 0,
    alignItems: "center",
  },
  tailOuter: {
    width: 0, height: 0,
    borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 15,
    borderLeftColor: "transparent", borderRightColor: "transparent",
  },
  tailInner: {
    position: "absolute",
    top: -15,
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 13,
    borderLeftColor: "transparent", borderRightColor: "transparent",
  },

  /* 마스코트 */
  mascotOuter: {
    width: 134, height: 134, borderRadius: 67,
    borderWidth: 2.5,
    alignItems: "center", justifyContent: "center",
    marginTop: 36,
  },
  mascotInner: {
    width: 104, height: 104, borderRadius: 52,
    alignItems: "center", justifyContent: "center",
  },

  /* 버튼 */
  btn: {
    backgroundColor: GREEN,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  btnText: { color: "#000000", fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
});
