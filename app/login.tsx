import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { supabase } from "./lib/supabase";
import { useTheme } from "../contexts/theme";

const GREEN = "#00C853";

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { colors } = useTheme();
  const subColor = colors.subtext;
  const inputBg  = colors.inputBg;

  const [tab,      setTab]      = useState<"login" | "signup">("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);

  /* 탭 슬라이더 애니메이션 */
  const tabAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: tab === "login" ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [tab]);

  /* 마스코트 흔들기 */
  const waveRot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveRot, { toValue: 1,  duration: 280, useNativeDriver: true }),
        Animated.timing(waveRot, { toValue: -1, duration: 280, useNativeDriver: true }),
        Animated.timing(waveRot, { toValue: 1,  duration: 280, useNativeDriver: true }),
        Animated.timing(waveRot, { toValue: 0,  duration: 280, useNativeDriver: true }),
        Animated.delay(1800),
      ])
    ).start();
  }, []);
  const rotate = waveRot.interpolate({ inputRange: [-1, 1], outputRange: ["-14deg", "14deg"] });

  /* 탭 인디케이터 위치 */
  const indicatorLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "52%"] });
  const indicatorW    = "46%";


  /* ── 로그인 ── */
  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      Alert.alert("로그인 실패", "이메일 또는 비밀번호를 확인해주세요.");
      setLoading(false);
      return;
    }
    /* 프로필 존재 여부 → 있으면 홈, 없으면 온보딩 */
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();

    setLoading(false);
    router.replace(profile ? "/(tabs)/home" : "/onboarding");
  }

  /* ── 회원가입 ── */
  async function handleSignup() {
    if (!email.trim() || !password || !confirm) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("비밀번호 불일치", "비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("비밀번호 오류", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      Alert.alert("회원가입 실패", error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    if (data.session) {
      /* 이메일 확인 없이 즉시 가입 → 온보딩으로 */
      router.replace("/onboarding");
    } else {
      /* 이메일 확인 필요 */
      Alert.alert(
        "이메일 확인",
        "가입 확인 이메일을 보냈어요.\n확인 후 로그인해주세요.",
        [{ text: "확인", onPress: () => setTab("login") }]
      );
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* 뒤로가기 */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={15} color={subColor} />
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── 로고 섹션 ─── */}
          <View style={styles.logoSection}>
            {/* 배경 글로우 */}
            <View style={[styles.glowCircle, { backgroundColor: `${GREEN}18` }]} />

            <Animated.Text style={[styles.mascot, { transform: [{ rotate }] }]}>
              💪
            </Animated.Text>

            <View style={styles.brandRow}>
              <Text style={[styles.brandWord, { color: colors.text }]}>PUSHUP</Text>
              <Text style={styles.brandWordGreen}> CHALLENGE</Text>
            </View>
            <Text style={[styles.brandSub, { color: subColor }]}>매일 조금씩, 강해지자</Text>
          </View>

          {/* ─── 탭 스위처 ─── */}
          <View style={[styles.tabWrap, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
            <Animated.View style={[styles.tabIndicator, { left: indicatorLeft, width: indicatorW, backgroundColor: GREEN }]} />
            <Pressable style={styles.tabBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab("login"); }}>
              <Text style={[styles.tabText, tab === "login" ? styles.tabTextActive : { color: subColor }]}>
                로그인
              </Text>
            </Pressable>
            <Pressable style={styles.tabBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab("signup"); }}>
              <Text style={[styles.tabText, tab === "signup" ? styles.tabTextActive : { color: subColor }]}>
                회원가입
              </Text>
            </Pressable>
          </View>

          {/* ─── 폼 ─── */}
          <View style={styles.form}>
            {/* 이메일 */}
            <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: colors.border }]}>
              <FontAwesome name="envelope-o" size={15} color={subColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="이메일"
                placeholderTextColor={subColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* 비밀번호 */}
            <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: colors.border }]}>
              <FontAwesome name="lock" size={16} color={subColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="비밀번호"
                placeholderTextColor={subColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPw(v => !v)} hitSlop={8}>
                <FontAwesome name={showPw ? "eye-slash" : "eye"} size={15} color={subColor} />
              </Pressable>
            </View>

            {/* 비밀번호 확인 (회원가입) */}
            {tab === "signup" && (
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: confirm && confirm !== password ? "#ff3b30" : colors.border }]}>
                <FontAwesome name="lock" size={16} color={subColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="비밀번호 확인"
                  placeholderTextColor={subColor}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showCf}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowCf(v => !v)} hitSlop={8}>
                  <FontAwesome name={showCf ? "eye-slash" : "eye"} size={15} color={subColor} />
                </Pressable>
              </View>
            )}

            {/* 비밀번호 불일치 경고 */}
            {tab === "signup" && confirm.length > 0 && confirm !== password && (
              <Text style={styles.errorText}>비밀번호가 일치하지 않아요</Text>
            )}

            {/* 제출 버튼 */}
            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }]}
              onPress={tab === "login" ? handleLogin : handleSignup}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitText}>처리 중...</Text>
              ) : (
                <View style={styles.submitInner}>
                  <Text style={styles.submitText}>{tab === "login" ? "로그인" : "회원가입"}</Text>
                  <FontAwesome name="arrow-right" size={14} color="#000" />
                </View>
              )}
            </Pressable>

            {/* 비밀번호 찾기 (로그인 탭) */}
            {tab === "login" && (
              <Pressable
                style={styles.forgotBtn}
                onPress={() => Alert.alert("비밀번호 재설정", "가입 이메일로 재설정 링크를 보내드릴게요.\n\n(준비 중인 기능입니다)")}
              >
                <Text style={[styles.forgotText, { color: subColor }]}>비밀번호를 잊으셨나요?</Text>
              </Pressable>
            )}
          </View>

          {/* ─── 하단 안내 ─── */}
          <View style={styles.footer}>
            <View style={[styles.dividerRow, { marginBottom: 16 }]}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: subColor }]}>
                {tab === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab(tab === "login" ? "signup" : "login");
                setConfirm("");
              }}
            >
              <Text style={styles.switchText}>
                {tab === "login" ? "회원가입하기" : "로그인하기"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    marginLeft: 12, marginTop: 4,
  },
  scroll: { paddingHorizontal: 24 },

  /* 로고 */
  logoSection: { alignItems: "center", marginTop: 8, marginBottom: 32, position: "relative" },
  glowCircle: {
    position: "absolute",
    width: 200, height: 200, borderRadius: 100,
    top: -20,
  },
  mascot: { fontSize: 72, marginBottom: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  brandWord: { fontSize: 28, fontWeight: "900", letterSpacing: 1 },
  brandWordGreen: { fontSize: 28, fontWeight: "900", letterSpacing: 1, color: GREEN },
  brandSub: { fontSize: 14, fontWeight: "500" },

  /* 탭 */
  tabWrap: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    position: "relative",
    height: 48,
    alignItems: "center",
  },
  tabIndicator: {
    position: "absolute",
    top: 4, bottom: 4,
    borderRadius: 10,
  },
  tabBtn: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 1 },
  tabText: { fontSize: 15, fontWeight: "700" },
  tabTextActive: { color: "#000000", fontWeight: "800" },

  /* 폼 */
  form: { gap: 12 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 15,
    gap: 10,
  },
  inputIcon: { width: 18, textAlign: "center" },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  errorText: { color: "#ff3b30", fontSize: 12, fontWeight: "600", marginTop: -4 },
  submitBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitText: { color: "#000", fontSize: 17, fontWeight: "800" },
  forgotBtn: { alignItems: "center", paddingVertical: 4 },
  forgotText: { fontSize: 13, fontWeight: "500" },

  /* 하단 */
  footer: { alignItems: "center", marginTop: 32 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "600" },
  switchText: { color: GREEN, fontSize: 15, fontWeight: "700" },
});
