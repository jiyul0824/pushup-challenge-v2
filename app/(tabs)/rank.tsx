import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useTheme } from "../../contexts/theme";

const GREEN    = "#00C853";
const ORANGE   = "#f97316";
const MY_ID    = 3;
const CURRENT_TIER = "골드";
const SEASON_DAYS  = 18;

const DUMMY_RANKS = [
  { id: 1,  nickname: "푸쉬업왕",     streak: 47 },
  { id: 2,  nickname: "근육맨",       streak: 43 },
  { id: 4,  nickname: "철봉고수",     streak: 35 },
  { id: 5,  nickname: "헬스장매니아", streak: 31 },
  { id: 6,  nickname: "새벽운동러",   streak: 28 },
  { id: 7,  nickname: "다이어터",     streak: 24 },
  { id: 8,  nickname: "운동초보",     streak: 19 },
  { id: 9,  nickname: "챌린저99",     streak: 14 },
  { id: 10, nickname: "파이팅",       streak: 9  },
  { id: 3,  nickname: "나",           streak: 0  },
];

const RANK_COLORS: Record<number, { text: string; bg: string; border: string }> = {
  1: { text: "#FFD700", bg: "rgba(255,215,0,0.12)",   border: "rgba(255,215,0,0.45)"  },
  2: { text: "#C0C0C0", bg: "rgba(192,192,192,0.12)", border: "rgba(192,192,192,0.4)" },
  3: { text: "#CD7F32", bg: "rgba(205,127,50,0.12)",  border: "rgba(205,127,50,0.4)"  },
};

const AVATAR_PALETTE = [
  "#7c3aed", "#db2777", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#4f46e5", "#0d9488",
];

function avatarColor(nickname: string) {
  let n = 0;
  for (let i = 0; i < nickname.length; i++) n += nickname.charCodeAt(i);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

/* ─── 시상대 (TOP 3) ─── */
function TopThree({ items, myNickname, myStreak }: {
  items: typeof DUMMY_RANKS; myNickname: string; myStreak: number;
}) {
  // [2등자리, 1등자리, 3등자리] 순서로 배치
  const POSITIONS = [
    { rank: 2, dataIdx: 1, podiumH: 80,  avatarSize: 52 },
    { rank: 1, dataIdx: 0, podiumH: 112, avatarSize: 68 },
    { rank: 3, dataIdx: 2, podiumH: 56,  avatarSize: 46 },
  ];

  return (
    <View style={top.container}>
      {POSITIONS.map(({ rank, dataIdx, podiumH, avatarSize }) => {
        const item     = items[dataIdx];
        const nickname = item.id === MY_ID ? myNickname : item.nickname;
        const streak   = item.id === MY_ID ? myStreak   : item.streak;
        const c        = RANK_COLORS[rank];
        const ac       = avatarColor(nickname);
        const isFirst  = rank === 1;

        return (
          <View key={rank} style={top.col}>
            {/* 1등 왕관 아이콘 */}
            {isFirst && (
              <View style={top.crownWrap}>
                <FontAwesome name="star" size={18} color="#FFD700" />
              </View>
            )}

            {/* 아바타 */}
            <View style={[top.avatar, {
              width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
              backgroundColor: ac,
              borderWidth: isFirst ? 3 : 2,
              borderColor: c.border,
            }]}>
              <Text style={[top.avatarText, { fontSize: isFirst ? 26 : 19 }]}>{nickname[0]}</Text>
            </View>

            {/* 닉네임 */}
            <Text style={[top.name, { color: c.text, fontSize: isFirst ? 13 : 11 }]} numberOfLines={1}>
              {nickname}
            </Text>

            {/* 스트릭 */}
            <View style={top.streakRow}>
              <Text style={top.streakFire}>🔥</Text>
              <Text style={[top.streakVal, { fontSize: isFirst ? 12 : 10 }]}>{streak}일</Text>
            </View>

            {/* 시상대 블록 */}
            <View style={[top.podium, {
              height: podiumH,
              backgroundColor: c.bg,
              borderColor: c.border,
            }]}>
              <Text style={[top.rankNum, { color: c.text, fontSize: isFirst ? 36 : 26 }]}>{rank}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const top = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 6,
    gap: 6,
  },
  col: { flex: 1, alignItems: "center", gap: 5 },
  crownWrap: { marginBottom: 2 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900" },
  name: { fontWeight: "700", textAlign: "center" },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  streakFire: { fontSize: 11 },
  streakVal: { color: ORANGE, fontWeight: "700" },
  podium: {
    width: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 14,
  },
  rankNum: { fontWeight: "900" },
});

/* ─── 순위 행 ─── */
function RankRow({ rank, nickname, streak, isMe, cardBg }: {
  rank: number; nickname: string; streak: number; isMe: boolean; cardBg: string;
}) {
  const { colors } = useTheme();
  const ac = avatarColor(nickname);
  const maxStreak = DUMMY_RANKS[0].streak;
  const barWidth  = Math.max((streak / maxStreak) * 100, 4);

  const rankColor   = "rgba(255,255,255,0.35)";
  const nameColor   = "#ffffff";
  const barTrackBg  = "rgba(255,255,255,0.08)";
  const unitColor   = "rgba(255,255,255,0.4)";
  const rowBorder   = "rgba(255,255,255,0.06)";

  return (
    <View style={[row.wrap, { backgroundColor: cardBg, borderColor: rowBorder }, isMe && row.wrapMe]}>
      <Text style={[row.rank, { color: rankColor }, isMe && { color: GREEN }]}>{rank}</Text>
      <View style={[row.avatar, { backgroundColor: ac }]}>
        <Text style={row.avatarText}>{nickname[0]}</Text>
      </View>
      <View style={row.info}>
        <Text style={[row.name, { color: nameColor }, isMe && { color: GREEN }]} numberOfLines={1}>
          {nickname}{isMe && <Text style={row.meTag}> · 나</Text>}
        </Text>
        <View style={[row.barWrap, { backgroundColor: barTrackBg }]}>
          <View style={[row.bar, { width: `${barWidth}%` as any, backgroundColor: isMe ? GREEN : ORANGE }]} />
        </View>
      </View>
      <View style={row.right}>
        <Text style={row.fire}>🔥</Text>
        <Text style={[row.streak, isMe && { color: GREEN }]}>{streak}</Text>
        <Text style={[row.unit, { color: unitColor }]}>일</Text>
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1,
  },
  wrapMe: { borderColor: "rgba(0,200,83,0.45)", backgroundColor: "rgba(0,200,83,0.07)" },
  rank: { width: 24, textAlign: "center", fontSize: 14, fontWeight: "700" },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  info: { flex: 1, gap: 6 },
  name: { fontSize: 14, fontWeight: "700" },
  meTag: { color: GREEN, fontSize: 12, fontWeight: "600" },
  barWrap: { height: 4, borderRadius: 2, overflow: "hidden" },
  bar: { height: 4, borderRadius: 2 },
  right: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  fire: { fontSize: 14, lineHeight: 20 },
  streak: { color: ORANGE, fontSize: 18, fontWeight: "900", lineHeight: 22 },
  unit: { fontSize: 12, fontWeight: "600", marginBottom: 1 },
});

/* ─── 메인 화면 ─── */
export default function RankTabScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [myNickname, setMyNickname] = useState("나");
  const [myStreak,   setMyStreak]   = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("nickname, streak").eq("id", user.id).single();
      if (data?.nickname) setMyNickname(data.nickname);
      if (data?.streak != null) setMyStreak(data.streak);
    })();
  }, []);

  const allRanks = DUMMY_RANKS.map(item => ({
    ...item,
    nickname: item.id === MY_ID ? myNickname : item.nickname,
    streak:   item.id === MY_ID ? myStreak   : item.streak,
  }));

  const sorted = [...allRanks].sort((a, b) => b.streak - a.streak);
  const myRank = sorted.findIndex(r => r.id === MY_ID) + 1;
  const top3   = sorted.slice(0, 3);
  const rest   = sorted.slice(3);

  const labelColor   = "rgba(255,255,255,0.4)";
  const sectionColor = "rgba(255,255,255,0.3)";
  const seasonColor  = "#ffffff";

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.tierLabel, { color: labelColor }]}>현재 티어</Text>
            <View style={styles.tierRow}>
              <FontAwesome name="trophy" size={16} color="#FFD700" />
              <Text style={styles.tierName}>{CURRENT_TIER}</Text>
            </View>
          </View>
          <View style={styles.seasonBox}>
            <Text style={[styles.tierLabel, { color: labelColor }]}>시즌 종료</Text>
            <Text style={[styles.seasonDays, { color: seasonColor }]}>{SEASON_DAYS}일 후</Text>
          </View>
        </View>

        {/* 내 순위 카드 */}
        <View style={styles.myCard}>
          <View>
            <Text style={styles.myLabel}>내 순위</Text>
            <Text style={styles.myRank}>#{myRank}</Text>
          </View>
          <View style={styles.myRight}>
            <View style={styles.myStreakRow}>
              <Text style={styles.myStreakFire}>🔥</Text>
              <Text style={styles.myStreakText}>{myStreak}일 연속</Text>
            </View>
            <Text style={[styles.myName, { color: "#ffffff" }]}>{myNickname}</Text>
          </View>
        </View>

        {/* 시상대 */}
        <Text style={[styles.sectionLabel, { color: sectionColor }]}>TOP 3</Text>
        <TopThree items={top3} myNickname={myNickname} myStreak={myStreak} />

        {/* 나머지 순위 */}
        <Text style={[styles.sectionLabel, { color: sectionColor }]}>전체 순위</Text>
        {rest.map((item, i) => (
          <RankRow
            key={item.id}
            rank={i + 4}
            nickname={item.nickname}
            streak={item.streak}
            isMe={item.id === MY_ID}
            cardBg={colors.card}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  tierLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tierName: { color: "#FFD700", fontSize: 20, fontWeight: "800" },
  seasonBox: { alignItems: "flex-end" },
  seasonDays: { fontSize: 18, fontWeight: "800" },

  myCard: {
    backgroundColor: "rgba(0,200,83,0.08)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(0,200,83,0.4)",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  myLabel: { color: "rgba(0,200,83,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  myRank: { color: GREEN, fontSize: 42, fontWeight: "900", lineHeight: 46 },
  myRight: { alignItems: "flex-end", gap: 6 },
  myStreakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  myStreakFire: { fontSize: 16 },
  myStreakText: { color: ORANGE, fontSize: 16, fontWeight: "700" },
  myName: { fontSize: 14, fontWeight: "600" },

  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, marginTop: 4 },
});
