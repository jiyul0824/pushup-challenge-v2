import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTierById, type TierVisualId } from "../../constants/tiers";

const BG = "#0a0a0a";
const GREEN = "#00C853";

/** 임시 더미 데이터 */
const DUMMY = {
  nickname: "챌린저",
  currentTierId: "gold" as TierVisualId,
  streakDays: 12,
  todayGoal: 25,
  seasonRemainingDays: 45,
  tierRank: 128,
};

export default function HomeTabScreen() {
  const insets = useSafeAreaInsets();
  const tier = getTierById(DUMMY.currentTierId);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          안녕하세요, {DUMMY.nickname}님!
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>현재 티어</Text>
          <View style={[styles.tierBadge, { borderColor: tier.color }]}>
            <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
            <Text style={[styles.tierName, { color: tier.color }]}>
              {tier.label}
            </Text>
          </View>
        </View>

        <View style={[styles.card, styles.streakCard]}>
          <Text style={styles.streakNumber}>{DUMMY.streakDays}</Text>
          <Text style={styles.streakSuffix}>일 연속</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>오늘 목표 푸쉬업</Text>
          <Text style={styles.cardValue}>
            <Text style={styles.cardValueAccent}>{DUMMY.todayGoal}</Text>
            <Text style={styles.cardValueUnit}> 개</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>이번 시즌 남은 기간</Text>
          <Text style={styles.cardValue}>
            <Text style={styles.cardValueAccent}>{DUMMY.seasonRemainingDays}</Text>
            <Text style={styles.cardValueUnit}> 일</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>티어 내 현재 순위</Text>
          <Text style={styles.cardValue}>
            <Text style={styles.cardValueAccent}>
              {DUMMY.tierRank.toLocaleString()}
            </Text>
            <Text style={styles.cardValueUnit}> 위</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  greeting: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 22,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 18,
    marginBottom: 14,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  cardValueAccent: {
    color: GREEN,
    fontSize: 28,
    fontWeight: "800",
  },
  cardValueUnit: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 20,
    fontWeight: "600",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  streakCard: {
    alignItems: "center",
    paddingVertical: 28,
  },
  streakNumber: {
    color: GREEN,
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 62,
    letterSpacing: -2,
  },
  streakSuffix: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 6,
  },
});
