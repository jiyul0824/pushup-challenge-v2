import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#0a0a0a";
const GREEN = "#00C853";
const KAKAO = "#FEE500";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function goOnboarding() {
    router.push("/onboarding");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.titleRow}>
          <Text style={styles.title}>PUSHUP </Text>
          <Text style={styles.titleAccent}>CHALLENGE</Text>
        </Text>
        <Text style={styles.slogan}>매일 조금씩, 강해지자</Text>
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 24) + 8 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.btnKakao, pressed && styles.pressed]}
          onPress={goOnboarding}
        >
          <Text style={styles.btnKakaoText}>카카오로 시작하기</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.btnGoogle,
            pressed && styles.pressed,
          ]}
          onPress={goOnboarding}
        >
          <Text style={styles.btnGoogleText}>Google로 시작하기</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnApple, pressed && styles.pressed]}
          onPress={goOnboarding}
        >
          <Text style={styles.btnAppleText}>Apple로 시작하기</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.btnEmail,
            pressed && styles.pressed,
          ]}
          onPress={goOnboarding}
        >
          <Text style={styles.btnEmailText}>이메일로 시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 48,
  },
  titleRow: {
    flexWrap: "wrap",
  },
  title: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  titleAccent: {
    color: GREEN,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  slogan: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 18,
  },
  pressed: {
    opacity: 0.88,
  },
  btnKakao: {
    backgroundColor: KAKAO,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnKakaoText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  btnGoogle: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGoogleText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  btnApple: {
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  btnAppleText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnEmail: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnEmailText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
