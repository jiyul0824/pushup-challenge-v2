import FontAwesome from "@expo/vector-icons/FontAwesome";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
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
import { StatusBar } from "expo-status-bar";

import { supabase } from "./lib/supabase";
import { useTheme } from "../contexts/theme";

const GREEN = "#00C853";

const TIERS = [
  { id: "bronze",   label: "브론즈",   color: "#CD7F32", start: 5  },
  { id: "silver",   label: "실버",     color: "#B0B0B0", start: 15 },
  { id: "gold",     label: "골드",     color: "#DAA520", start: 25 },
  { id: "platinum", label: "플래티넘", color: "#20B2AA", start: 30 },
  { id: "diamond",  label: "다이아",   color: "#44CCFF", start: 40 },
  { id: "master",   label: "마스터",   color: "#9B30FF", start: 60 },
];

const STEP_MESSAGES: Record<number, string> = {
  1: "안녕하세요!\n챌린지에서 사용할 닉네임을 입력해주세요.",
  2: "성별을 선택해주세요.\n운동 플랜 구성에 활용돼요.",
  3: "나이를 알려주세요.\n연령대에 맞는 목표를 드릴게요.",
  4: "키를 알려주세요.\n자세 안내에 반영할게요.",
  5: "몸무게를 알려주세요.\n최적의 운동 강도를 계산할게요.",
  6: "시작 티어를 선택해주세요.\n티어마다 일일 목표 개수가 달라요.",
};

/* ── 말풍선 ── */
function SpeechBubble({ text, cardBg, borderColor, textColor }: {
  text: string; cardBg: string; borderColor: string; textColor: string;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text]);

  return (
    <View style={[bubble.wrap, { backgroundColor: cardBg, borderColor }]}>
      <View style={[bubble.tail, { borderRightColor: borderColor }]} />
      <Text style={[bubble.text, { color: textColor }]}>{displayed}</Text>
    </View>
  );
}

const bubble = StyleSheet.create({
  wrap: {
    borderRadius: 18, borderWidth: 1.5,
    paddingVertical: 18, paddingHorizontal: 18,
    flex: 1, minHeight: 88, justifyContent: "center",
  },
  text: { fontSize: 16, fontWeight: "600", lineHeight: 26, letterSpacing: 0.1 },
  tail: {
    position: "absolute",
    left: -10, top: 24,
    width: 0, height: 0,
    borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 10,
    borderTopColor: "transparent", borderBottomColor: "transparent",
  },
});

/* ── 마스코트 아이콘 ── */
function Mascot({ borderColor }: { borderColor: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 550, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 550, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[mascotStyles.outer, {
      backgroundColor: `${GREEN}18`,
      borderColor: borderColor,
    }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <FontAwesome name="bolt" size={38} color={GREEN} />
      </Animated.View>
    </View>
  );
}

const mascotStyles = StyleSheet.create({
  outer: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
});

/* ── 메인 화면 ── */
export default function Onboarding() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { colors } = useTheme();

  const [step,     setStep]     = useState(1);
  const [nickname, setNickname] = useState("");
  const [gender,   setGender]   = useState("");
  const [age,      setAge]      = useState(25);
  const [height,   setHeight]   = useState(170);
  const [weight,   setWeight]   = useState(70);
  const [tier,     setTier]     = useState("bronze");
  const [loading,  setLoading]  = useState(false);

  const canNext = (() => {
    if (step === 1) return nickname.trim().length > 0;
    if (step === 2) return gender !== "";
    return true;
  })();

  /* 버튼 색 애니메이션 */
  const btnAnim = useRef(new Animated.Value(canNext ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(btnAnim, { toValue: canNext ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [canNext]);
  const btnBg = btnAnim.interpolate({ inputRange: [0, 1], outputRange: ["#DDDDDD", GREEN] });
  const btnTextColor = btnAnim.interpolate({ inputRange: [0, 1], outputRange: ["#AAAAAA", "#000000"] });

  /* 다음 / 완료 */
  const handleNext = async () => {
    if (!canNext) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 6) { setStep(step + 1); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인 정보를 찾을 수 없어요.");
      const { error } = await supabase.from("profiles").upsert({
        id: user.id, nickname, gender, age, height, weight, tier, streak: 0,
      });
      if (error) throw error;
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("오류", e.message ?? "저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  /* 공통 색 */
  const sub = colors.subtext;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* 진행바 */}
          <View style={styles.progressRow}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); step > 1 ? setStep(step - 1) : router.back(); }}
              style={styles.backBtn}
            >
              <FontAwesome name="chevron-left" size={16} color={sub} />
            </Pressable>
            <View style={styles.barWrap}>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.barFill, { width: `${(step / 6) * 100}%` }]} />
              </View>
            </View>
            <Text style={[styles.stepText, { color: sub }]}>{step}/6</Text>
          </View>

          {/* 마스코트 + 말풍선 */}
          <View style={styles.mascotRow}>
            <Mascot borderColor={colors.border} />
            <SpeechBubble
              text={STEP_MESSAGES[step]}
              cardBg={colors.card}
              borderColor={colors.border}
              textColor={colors.text}
            />
          </View>

          {/* 1단계: 닉네임 */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, { color: sub }]}>닉네임</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder="닉네임 입력"
                placeholderTextColor={sub}
                value={nickname}
                onChangeText={setNickname}
                autoFocus
                maxLength={12}
              />
            </View>
          )}

          {/* 2단계: 성별 */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, { color: sub }]}>성별</Text>
              <View style={styles.genderRow}>
                {[
                  { id: "male",   label: "남성", icon: "male"   },
                  { id: "female", label: "여성", icon: "female" },
                ].map(g => (
                  <Pressable
                    key={g.id}
                    style={[
                      styles.genderCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      gender === g.id && { borderColor: GREEN, borderWidth: 2.5 },
                    ]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGender(g.id); }}
                  >
                    <FontAwesome name={g.icon as any} size={100} color={gender === g.id ? GREEN : colors.subtext} />
                    <Text style={[styles.genderText, { color: colors.text }]}>{g.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* 3단계: 나이 */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, { color: sub }]}>나이</Text>
              <Text style={styles.sliderValue}>{age}<Text style={styles.sliderUnit}> 세</Text></Text>
              <Slider
                style={styles.slider}
                minimumValue={10} maximumValue={80} step={1}
                value={age} onValueChange={setAge}
                minimumTrackTintColor={GREEN} maximumTrackTintColor={colors.border} thumbTintColor={GREEN}
              />
              <View style={styles.rangeRow}>
                <Text style={[styles.rangeText, { color: sub }]}>10세</Text>
                <Text style={[styles.rangeText, { color: sub }]}>80세</Text>
              </View>
            </View>
          )}

          {/* 4단계: 키 */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, { color: sub }]}>키</Text>
              <Text style={styles.sliderValue}>{height}<Text style={styles.sliderUnit}> cm</Text></Text>
              <Slider
                style={styles.slider}
                minimumValue={140} maximumValue={220} step={1}
                value={height} onValueChange={setHeight}
                minimumTrackTintColor={GREEN} maximumTrackTintColor={colors.border} thumbTintColor={GREEN}
              />
              <View style={styles.rangeRow}>
                <Text style={[styles.rangeText, { color: sub }]}>140cm</Text>
                <Text style={[styles.rangeText, { color: sub }]}>220cm</Text>
              </View>
            </View>
          )}

          {/* 5단계: 몸무게 */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, { color: sub }]}>몸무게</Text>
              <Text style={styles.sliderValue}>{weight}<Text style={styles.sliderUnit}> kg</Text></Text>
              <Slider
                style={styles.slider}
                minimumValue={30} maximumValue={150} step={1}
                value={weight} onValueChange={setWeight}
                minimumTrackTintColor={GREEN} maximumTrackTintColor={colors.border} thumbTintColor={GREEN}
              />
              <View style={styles.rangeRow}>
                <Text style={[styles.rangeText, { color: sub }]}>30kg</Text>
                <Text style={[styles.rangeText, { color: sub }]}>150kg</Text>
              </View>
            </View>
          )}

          {/* 6단계: 티어 */}
          {step === 6 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, { color: sub }]}>시작 티어</Text>
              <View style={styles.tierGrid}>
                {TIERS.map(t => (
                  <Pressable
                    key={t.id}
                    style={[
                      styles.tierCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      tier === t.id && { borderColor: t.color, borderWidth: 2.5, backgroundColor: `${t.color}10` },
                    ]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTier(t.id); }}
                  >
                    <View style={[styles.tierDot, { backgroundColor: t.color }]} />
                    <Text style={[styles.tierLabel, { color: colors.text }]}>{t.label}</Text>
                    <Text style={[styles.tierGoal, { color: sub }]}>{t.start}개 / 일</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* 다음 버튼 */}
      <Animated.View style={[styles.nextBtn, { backgroundColor: btnBg, bottom: insets.bottom + 24 }]}>
        <Pressable style={styles.nextBtnInner} onPress={handleNext}>
          <Animated.Text style={[styles.nextText, { color: btnTextColor }]}>
            {loading ? "저장중..." : step === 6 ? "시작하기" : "다음"}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  /* 진행바 */
  progressRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  barWrap: { flex: 1 },
  barTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  barFill: { height: 10, backgroundColor: GREEN, borderRadius: 5 },
  stepText: { fontSize: 13, fontWeight: "700", width: 28, textAlign: "right" },

  /* 마스코트 행 */
  mascotRow: {
    flexDirection: "row", alignItems: "center",
    marginTop: 24, marginBottom: 32, gap: 16,
  },

  /* 스텝 콘텐츠 */
  stepContent: { gap: 20 },
  stepLabel: {
    fontSize: 13, fontWeight: "700",
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  input: {
    padding: 18, borderRadius: 14, fontSize: 18,
    borderWidth: 1.5, fontWeight: "600",
  },

  /* 성별 */
  genderRow: { flexDirection: "row", gap: 14 },
  genderCard: {
    flex: 1, minHeight: 240,
    borderRadius: 18, paddingVertical: 28,
    alignItems: "center", justifyContent: "center",
    gap: 16, borderWidth: 1.5,
  },
  genderText: { fontSize: 17, fontWeight: "700" },

  /* 슬라이더 */
  sliderValue: { fontSize: 56, fontWeight: "900", color: GREEN, textAlign: "center", letterSpacing: -1 },
  sliderUnit: { fontSize: 26, fontWeight: "600", color: "rgba(0,200,83,0.6)" },
  slider: { width: "100%", height: 44 },
  rangeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -8 },
  rangeText: { fontSize: 12, fontWeight: "600" },

  /* 티어 */
  tierGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tierCard: {
    width: "47%", borderRadius: 14,
    padding: 18, alignItems: "center",
    gap: 10, borderWidth: 1.5,
  },
  tierDot: { width: 14, height: 14, borderRadius: 7 },
  tierLabel: { fontSize: 16, fontWeight: "800" },
  tierGoal: { fontSize: 13, fontWeight: "600" },

  /* 다음 버튼 */
  nextBtn: {
    position: "absolute", left: 24, right: 24,
    borderRadius: 16, overflow: "hidden",
  },
  nextBtnInner: { padding: 20, alignItems: "center" },
  nextText: { fontWeight: "800", fontSize: 17, letterSpacing: 0.3 },
});
