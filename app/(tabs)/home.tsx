import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../lib/supabase";
import { getTierById, TIERS, type TierVisualId } from "../../constants/tiers";
import { useTheme } from "../../contexts/theme";

const GREEN = "#00C853";
const ORANGE = "#f97316";

type Profile = { nickname: string; tier: TierVisualId; streak: number };

const TIER_COLORS: Record<TierVisualId, string> = {
  bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#20B2AA", diamond: "#44CCFF", master: "#9B30FF",
};

const TIER_ICONS: Record<TierVisualId, string> = {
  bronze: "shield",
  silver: "star",
  gold: "trophy",
  platinum: "diamond",
  diamond: "certificate",
  master: "rocket",
};

// 이번 주 더미 완료 데이터 (0=일 ~ 6=토)
const WEEK_DONE = [true, true, false, true, true, false, false];
const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MY_LEAGUE_RANK = 7; // 더미 순위

export default function HomeTabScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme, setTierTheme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles").select("nickname, tier, streak").eq("id", user.id).single();
      if (data) {
        const t = (data.tier ?? "bronze") as TierVisualId;
        setProfile({
          nickname: data.nickname ?? "챌린저",
          tier: t,
          streak: data.streak ?? 0,
        });
        setTierTheme(t);
      }
      setLoading(false);
    })();
  }, []);

  const tier = getTierById(profile?.tier ?? "bronze");
  const tierColor = TIER_COLORS[profile?.tier ?? "bronze"];
  const todayGoal = TIERS.find(t => t.id === profile?.tier)?.goal ?? 5;
  const todayDone = false; // 실제로는 오늘 완료 여부
  const todayProgress = 0; // 실제로는 오늘 한 개수

  const now = new Date();
  const todayIdx = now.getDay();

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={GREEN} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* 배경 티어 아이콘 워터마크 */}
      <View style={styles.bgWatermark}>
        <FontAwesome
          name={TIER_ICONS[profile?.tier ?? "bronze"] as any}
          size={300}
          color="#fff"
          style={{ opacity: 0.07 }}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 헤더 */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greetSmall, { color: colors.subtext }]}>안녕하세요</Text>
            <Text style={[styles.greetName, { color: colors.text }]}>{profile?.nickname ?? "챌린저"}</Text>
          </View>
          {/* 다크모드 제거됨 */}
        </View>

        {/* 티어 배지 */}
        <View style={[styles.tierCard, { borderColor: tierColor, backgroundColor: colors.card }]}>
          {/* 배경 장식 아이콘 */}
          <View style={[styles.tierBgIcon, { pointerEvents: "none" }]}>
            <FontAwesome name={TIER_ICONS[profile?.tier ?? "bronze"] as any} size={130} color={tierColor} style={{ opacity: 0.1 }} />
          </View>
          {/* 아이콘 서클 */}
          <View style={[styles.tierIconCircle, { backgroundColor: `${tierColor}1A`, borderColor: `${tierColor}55` }]}>
            <FontAwesome name={TIER_ICONS[profile?.tier ?? "bronze"] as any} size={28} color={tierColor} />
          </View>
          {/* 티어명 */}
          <View style={styles.tierTextCol}>
            <Text style={[styles.tierSmallLabel, { color: colors.subtext }]}>현재 티어</Text>
            <Text style={[styles.tierName, { color: tierColor }]}>{tier.label}</Text>
          </View>
          {/* 목표 배지 */}
          <View style={[styles.tierGoalBadge, { backgroundColor: `${tierColor}18`, borderColor: `${tierColor}50` }]}>
            <Text style={[styles.tierGoalNum, { color: tierColor }]}>{todayGoal}</Text>
            <Text style={[styles.tierGoalUnit, { color: tierColor }]}>개/일</Text>
          </View>
        </View>

        {/* 오늘의 챌린지 메인 카드 */}
        <View style={[styles.challengeCard, { borderColor: GREEN }]}>
          <View style={styles.challengeTop}>
            <View style={styles.challengeLabelRow}>
              <FontAwesome name="bolt" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.challengeLabel}>오늘의 챌린지</Text>
            </View>
            {todayDone && (
              <View style={styles.donePill}>
                <FontAwesome name="check" size={10} color="#000" />
                <Text style={styles.donePillText}>완료</Text>
              </View>
            )}
          </View>

          <View style={styles.challengeCenter}>
            <Text style={styles.challengeNum}>{todayGoal}</Text>
            <Text style={styles.challengeUnit}>개</Text>
          </View>

          {/* 진행 바 */}
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <View style={[styles.progressFill, { width: `${Math.min((todayProgress / todayGoal) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{todayProgress} / {todayGoal}개</Text>
          </View>

          {/* 시작 버튼 */}
          <Pressable
            style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.88 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.navigate("/(tabs)/start"); }}
          >
            <FontAwesome name="bolt" size={16} color="#000" />
            <Text style={styles.startBtnText}>챌린지 시작</Text>
          </Pressable>
        </View>

        {/* 스탯 카드 2열 */}
        <View style={styles.row}>
          {/* 연속 달성 */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 28 }}>🔥</Text>
            <Text style={[styles.statNum, { color: ORANGE }]}>{profile?.streak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>일 연속</Text>
          </View>

          {/* 리그 순위 */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FontAwesome name="trophy" size={28} color="#FFD700" />
            <Text style={[styles.statNum, { color: "#FFD700" }]}>#{MY_LEAGUE_RANK}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>리그 순위</Text>
          </View>
        </View>

        {/* 이번 주 활동 */}
        <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.weekTitle, { color: colors.text }]}>이번 주 활동</Text>
          <View style={styles.weekRow}>
            {WEEK_LABELS.map((label, i) => {
              const isToday = i === todayIdx;
              const done = WEEK_DONE[i];
              return (
                <View key={i} style={styles.weekDay}>
                  <View style={[
                    styles.weekDot,
                    { backgroundColor: "rgba(0,0,0,0.08)" },
                    done && styles.weekDotDone,
                    !done && i < todayIdx && styles.weekDotMiss,
                    isToday && !done && styles.weekDotToday,
                  ]}>
                    {done
                      ? <FontAwesome name="check" size={10} color="#fff" />
                      : i < todayIdx && !isToday && <FontAwesome name="times" size={10} color="rgba(255,59,48,0.7)" />
                    }
                  </View>
                  <Text style={[
                    styles.weekLabel,
                    { color: isToday ? GREEN : colors.subtext },
                    isToday && { fontWeight: "800" },
                  ]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 경쟁 배너 */}
        <View style={[styles.rivalBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rivalLeft}>
            <FontAwesome name="shield" size={28} color="#f97316" />
            <View>
              <Text style={[styles.rivalTitle, { color: colors.text }]}>리그 경쟁 진행 중</Text>
              <Text style={[styles.rivalSub, { color: colors.subtext }]}>시즌 종료까지 18일 남았어요</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.rivalBtn, pressed && { opacity: 0.8 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.navigate("/(tabs)/rank"); }}
          >
            <Text style={styles.rivalBtnText}>순위 보기</Text>
            <FontAwesome name="chevron-right" size={10} color={GREEN} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  bgWatermark: {
    position: "absolute",
    bottom: -30,
    right: -30,
    pointerEvents: "none" as any,
  },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  /* 헤더 */
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greetSmall: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  greetName: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  tierCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 2, borderRadius: 20,
    paddingVertical: 18, paddingHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  tierBgIcon: {
    position: "absolute",
    right: -16,
    top: -16,
  },
  tierIconCircle: {
    width: 54, height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tierTextCol: { flex: 1 },
  tierSmallLabel: { fontSize: 11, fontWeight: "600", marginBottom: 3, opacity: 0.7 },
  tierName: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  tierGoalBadge: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  tierGoalNum: { fontSize: 22, fontWeight: "900" },
  tierGoalUnit: { fontSize: 11, fontWeight: "700" },

  /* 챌린지 카드 */
  challengeCard: {
    backgroundColor: "#005A1E",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    marginBottom: 14,
  },
  challengeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  challengeLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  challengeLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  donePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GREEN, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  donePillText: { color: "#000", fontSize: 11, fontWeight: "800" },
  challengeCenter: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 20 },
  challengeNum: { color: "#ffffff", fontSize: 80, fontWeight: "900", lineHeight: 84, letterSpacing: -2 },
  challengeUnit: { color: "rgba(255,255,255,0.5)", fontSize: 28, fontWeight: "700", marginBottom: 10 },
  progressWrap: { gap: 6, marginBottom: 20 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: GREEN, borderRadius: 3 },
  progressLabel: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600" },
  startBtn: {
    backgroundColor: GREEN, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  startBtnText: { color: "#000000", fontSize: 16, fontWeight: "800" },

  /* 스탯 2열 */
  row: { flexDirection: "row", gap: 12, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 18, alignItems: "center", gap: 4 },
  statNum: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  statLabel: { fontSize: 12, fontWeight: "600" },

  /* 이번 주 활동 */
  weekCard: { borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 14 },
  weekTitle: { fontSize: 15, fontWeight: "800", marginBottom: 16 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: { alignItems: "center", gap: 8 },
  weekDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  weekDotDone: { backgroundColor: GREEN },
  weekDotMiss: { backgroundColor: "rgba(255,59,48,0.12)", borderWidth: 1, borderColor: "rgba(255,59,48,0.3)" },
  weekDotToday: { borderWidth: 2, borderColor: GREEN },
  weekLabel: { fontSize: 12, fontWeight: "600" },

  /* 경쟁 배너 */
  rivalBanner: {
    borderRadius: 18, borderWidth: 1, padding: 18,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  rivalLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rivalTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  rivalSub: { fontSize: 12, fontWeight: "500" },
  rivalBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: "rgba(0,200,83,0.12)",
    borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,200,83,0.3)",
  },
  rivalBtnText: { color: GREEN, fontSize: 12, fontWeight: "700" },
});
