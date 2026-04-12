import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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

import {
  FemaleSilhouetteIcon,
  MaleSilhouetteIcon,
  TierPushupIcon,
  type TierVisualId,
} from "../components/onboarding-illustrations";

const BG = "#0a0a0a";
const GREEN = "#00C853";
const WHITE_BORDER = "#ffffff";

const TOTAL_STEPS = 6;

const TIERS = [
  { id: "bronze" as const, label: "브론즈", goal: 5, color: "#CD7F32" },
  { id: "silver" as const, label: "실버", goal: 15, color: "#B0B0B0" },
  { id: "gold" as const, label: "골드", goal: 25, color: "#DAA520" },
  { id: "platinum" as const, label: "플래티넘", goal: 30, color: "#20B2AA" },
  { id: "diamond" as const, label: "다이아", goal: 40, color: "#44CCFF" },
  { id: "master" as const, label: "마스터", goal: 60, color: "#9B30FF" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [age, setAge] = useState(25);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [tierId, setTierId] = useState<TierVisualId | null>(null);

  const progress = step / TOTAL_STEPS;

  const canGoNext = (() => {
    switch (step) {
      case 1:
        return nickname.trim().length > 0;
      case 2:
        return gender !== null;
      case 3:
      case 4:
      case 5:
        return true;
      case 6:
        return tierId !== null;
      default:
        return false;
    }
  })();

  function handleBack() {
    if (step <= 1) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  }

  function handleNext() {
    if (!canGoNext) return;
    if (step >= TOTAL_STEPS) {
      router.replace("/home");
      return;
    }
    setStep((s) => s + 1);
  }

  const nextLabel = step === TOTAL_STEPS ? "시작하기" : "다음";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar style="light" />

        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={28} color="#ffffff" />
          </Pressable>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {step} / {TOTAL_STEPS}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <>
              <Text style={styles.question}>닉네임을 알려주세요</Text>
              <Text style={styles.hint}>챌린지에서 사용할 이름이에요</Text>
              <TextInput
                style={styles.input}
                placeholder="닉네임 입력"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.question}>성별을 선택해 주세요</Text>
              <View style={styles.genderRow}>
                <Pressable
                  onPress={() => setGender("male")}
                  style={({ pressed }) => [
                    styles.genderCard,
                    {
                      borderColor:
                        gender === "male" ? GREEN : WHITE_BORDER,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <MaleSilhouetteIcon size={148} color="#ffffff" />
                  <Text style={styles.genderCardTitle}>남성</Text>
                </Pressable>
                <Pressable
                  onPress={() => setGender("female")}
                  style={({ pressed }) => [
                    styles.genderCard,
                    {
                      borderColor:
                        gender === "female" ? GREEN : WHITE_BORDER,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <FemaleSilhouetteIcon size={148} color="#ffffff" />
                  <Text style={styles.genderCardTitle}>여성</Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.question}>나이를 선택해 주세요</Text>
              <Text style={styles.valueLarge}>{age}세</Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={80}
                step={1}
                value={age}
                onValueChange={setAge}
                minimumTrackTintColor={GREEN}
                maximumTrackTintColor="#333333"
                thumbTintColor={GREEN}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>10</Text>
                <Text style={styles.sliderLabel}>80</Text>
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.question}>키를 선택해 주세요</Text>
              <Text style={styles.valueLarge}>{heightCm} cm</Text>
              <Slider
                style={styles.slider}
                minimumValue={100}
                maximumValue={220}
                step={1}
                value={heightCm}
                onValueChange={setHeightCm}
                minimumTrackTintColor={GREEN}
                maximumTrackTintColor="#333333"
                thumbTintColor={GREEN}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>100</Text>
                <Text style={styles.sliderLabel}>220</Text>
              </View>
            </>
          )}

          {step === 5 && (
            <>
              <Text style={styles.question}>몸무게를 선택해 주세요</Text>
              <Text style={styles.valueLarge}>{weightKg} kg</Text>
              <Slider
                style={styles.slider}
                minimumValue={30}
                maximumValue={150}
                step={1}
                value={weightKg}
                onValueChange={setWeightKg}
                minimumTrackTintColor={GREEN}
                maximumTrackTintColor="#333333"
                thumbTintColor={GREEN}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>30</Text>
                <Text style={styles.sliderLabel}>150</Text>
              </View>
            </>
          )}

          {step === 6 && (
            <>
              <Text style={styles.question}>목표 티어를 선택해 주세요</Text>
              <Text style={styles.hint}>티어마다 일일 목표 푸쉬업 개수가 달라요</Text>
              <View style={styles.tierGrid}>
                {TIERS.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setTierId(t.id)}
                    style={({ pressed }) => [
                      styles.tierCard,
                      {
                        borderColor:
                          tierId === t.id ? t.color : WHITE_BORDER,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.tierIconWrap}>
                      <TierPushupIcon
                        tier={t.id}
                        color={t.color}
                        width={118}
                        height={76}
                      />
                    </View>
                    <Text style={styles.tierName}>{t.label}</Text>
                    <Text style={styles.tierGoal}>시작 {t.goal}개</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <Pressable
            onPress={handleNext}
            disabled={!canGoNext}
            style={({ pressed }) => [
              styles.nextBtn,
              !canGoNext && styles.nextBtnDisabled,
              pressed && canGoNext && styles.pressed,
            ]}
          >
            <Text style={styles.nextBtnText}>{nextLabel}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    paddingHorizontal: 8,
    paddingRight: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: {
    flex: 1,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  progressText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    alignSelf: "flex-end",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  question: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    marginTop: 8,
  },
  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#333333",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: "#ffffff",
    backgroundColor: "#141414",
  },
  genderRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 28,
  },
  genderCard: {
    flex: 1,
    minHeight: 240,
    paddingVertical: 24,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: "#141414",
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  genderCardTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "700",
  },
  valueLarge: {
    color: GREEN,
    fontSize: 44,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 8,
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 44,
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  tierGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginTop: 20,
  },
  tierCard: {
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#141414",
    borderWidth: 2.5,
  },
  tierIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    minHeight: 78,
  },
  tierName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  tierGoal: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a2a",
    backgroundColor: BG,
  },
  nextBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
  },
});
