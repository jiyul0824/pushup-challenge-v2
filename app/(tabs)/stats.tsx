import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/theme";

const GREEN = "#00C853";
const DONE_COLOR = "#00e676";
const RED = "#FF3B30";

// 더미 데이터
const STREAK = 5;
const TOTAL_PUSHUPS = 1_240;
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function to12h(time: string) {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${mStr}`;
}

type Session = { time: string; count: number };
type DayData = { sessions: Session[]; rank: number };

const WORKOUT_DATA: Record<number, DayData> = {
  1:  { sessions: [{ time: "07:32", count: 30 }], rank: 3 },
  2:  { sessions: [{ time: "08:15", count: 25 }, { time: "20:40", count: 20 }], rank: 5 },
  3:  { sessions: [{ time: "06:58", count: 40 }], rank: 2 },
  5:  { sessions: [{ time: "12:10", count: 30 }], rank: 7 },
  6:  { sessions: [{ time: "07:00", count: 35 }, { time: "19:22", count: 15 }], rank: 4 },
  8:  { sessions: [{ time: "08:45", count: 50 }], rank: 1 },
  9:  { sessions: [{ time: "07:30", count: 30 }], rank: 6 },
  10: { sessions: [{ time: "06:50", count: 45 }], rank: 2 },
  12: { sessions: [{ time: "09:00", count: 25 }], rank: 9 },
  13: { sessions: [{ time: "07:20", count: 30 }, { time: "21:05", count: 20 }], rank: 3 },
  14: { sessions: [{ time: "08:00", count: 40 }], rank: 4 },
};
const DONE_DAYS = new Set(Object.keys(WORKOUT_DATA).map(Number));

/* ─── 날짜 팝업 ─── */
function DayPopup({
  day, month, data, onClose,
}: {
  day: number; month: number; data: DayData; onClose: () => void;
}) {
  const { colors } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const total = data.sessions.reduce((s, e) => s + e.count, 0);

  const dividerColor    = "rgba(255,255,255,0.07)";
  const closeIconColor  = "rgba(255,255,255,0.35)";
  const totalUnitColor  = "rgba(255,255,255,0.35)";
  const sessionRowBg    = "rgba(255,255,255,0.04)";
  const sessionBorder   = "rgba(255,255,255,0.06)";
  const timeTextColor   = "rgba(255,255,255,0.75)";
  const cardBorderColor = colors.border;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={popup.backdrop} onPress={onClose}>
        <Animated.View
          style={[popup.card, {
            backgroundColor: colors.card,
            borderColor: cardBorderColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }]}
          onStartShouldSetResponder={() => true}
        >
          {/* 헤더 */}
          <View style={[popup.header, { borderBottomColor: dividerColor }]}>
            <Text style={[popup.dateText, { color: colors.text }]}>{month + 1}월 {day}일</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <FontAwesome name="times" size={16} color={closeIconColor} />
            </Pressable>
          </View>

          {/* 총 개수 + 순위 */}
          <View style={popup.totalRow}>
            <View style={popup.totalLeft}>
              <Text style={popup.totalNum}>{total}</Text>
              <Text style={[popup.totalUnit, { color: totalUnitColor }]}>개</Text>
            </View>
            <View style={popup.rankBadge}>
              <Text style={popup.rankBadgeLabel}>전체 순위</Text>
              <Text style={popup.rankBadgeNum}>#{data.rank}위</Text>
            </View>
          </View>

          {/* 세션 목록 */}
          <View style={popup.sessions}>
            {data.sessions.map((s, i) => (
              <View
                key={i}
                style={[popup.sessionRow, { backgroundColor: sessionRowBg, borderColor: sessionBorder }]}
              >
                <View style={popup.timeBadge}>
                  <FontAwesome name="clock-o" size={11} color={DONE_COLOR} />
                  <Text style={[popup.timeText, { color: timeTextColor }]}>{to12h(s.time)}</Text>
                </View>
                <Text style={popup.sessionCount}>{s.count}개</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const popup = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    width: 300,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  dateText: { fontSize: 16, fontWeight: "800" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  totalLeft: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  totalNum: { color: DONE_COLOR, fontSize: 52, fontWeight: "900", lineHeight: 56 },
  totalUnit: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  rankBadge: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 2,
  },
  rankBadgeLabel: {
    color: "rgba(245,158,11,0.65)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  rankBadgeNum: { color: "#f59e0b", fontSize: 22, fontWeight: "900" },
  sessions: { gap: 8 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  timeBadge: { flexDirection: "row", alignItems: "center", gap: 7 },
  timeText: { fontSize: 14, fontWeight: "600" },
  sessionCount: { color: DONE_COLOR, fontSize: 15, fontWeight: "800" },
});

/* ─── 달력 ─── */
function Calendar({
  year,
  month,
  onDayPress,
}: {
  year: number;
  month: number;
  onDayPress: (day: number) => void;
}) {
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const today = now.getDate();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const labelColor  = "rgba(255,255,255,0.4)";
  const dayColor    = "rgba(255,255,255,0.65)";

  return (
    <View style={cal.wrap}>
      <View style={cal.row}>
        {DAYS_OF_WEEK.map((d) => (
          <View key={d} style={cal.cell}>
            <Text style={[
              cal.dayLabel,
              { color: labelColor },
              d === "일" && { color: "#ff453a" },
              d === "토" && { color: "#0a84ff" },
            ]}>
              {d}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={cal.row}>
          {week.map((day, di) => {
            const isDone  = day !== null && isCurrentMonth && DONE_DAYS.has(day);
            const isToday = isCurrentMonth && day === today;
            return (
              <Pressable
                key={di}
                style={cal.cell}
                onPress={() => {
                  if (day && isDone) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDayPress(day);
                  }
                }}
              >
                {day !== null && (
                  <View style={[
                    cal.dayCircle,
                    isDone && cal.doneBg,
                    isToday && !isDone && cal.todayBorder,
                  ]}>
                    <Text style={[
                      cal.dayNum,
                      { color: dayColor },
                      isDone  && cal.doneText,
                      isToday && !isDone && { color: GREEN },
                    ]}>
                      {day}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cal = StyleSheet.create({
  wrap: { width: "100%" },
  row: { flexDirection: "row" },
  cell: { flex: 1, alignItems: "center", paddingVertical: 5 },
  dayLabel: { fontSize: 12, fontWeight: "700" },
  dayCircle: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  doneBg: {
    backgroundColor: "rgba(0,230,118,0.18)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,230,118,0.55)",
  },
  todayBorder: { borderWidth: 1.5, borderColor: GREEN, borderRadius: 10 },
  dayNum: { fontSize: 14, fontWeight: "600" },
  doneText: { color: DONE_COLOR, fontWeight: "800", fontSize: 14 },
});

/* ─── 메인 화면 ─── */
export default function StatsTabScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const goPrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const arrowColor         = "rgba(255,255,255,0.6)";
  const arrowDisabledColor = "rgba(255,255,255,0.15)";

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="light" />

      <Text style={[styles.pageTitle, { color: colors.text }]}>통계</Text>

      {/* 연속 달성 카드 */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.streakLabel, { color: colors.subtext }]}>연속 달성</Text>
        <View style={styles.streakRow}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakNum}>{STREAK}</Text>
          <View style={styles.streakSuffix}>
            <Text style={[styles.streakUnit, { color: colors.subtext }]}>일</Text>
            <Text style={[styles.streakContinue, { color: colors.subtext }]}>연속</Text>
          </View>
        </View>
      </View>

      {/* 달력 카드 */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.calHeader}>
          <Pressable onPress={goPrev} style={styles.calArrow} hitSlop={12}>
            <FontAwesome name="chevron-left" size={14} color={arrowColor} />
          </Pressable>
          <Text style={[styles.calTitle, { color: colors.text }]}>
            {viewYear}년 {viewMonth + 1}월
          </Text>
          <Pressable
            onPress={goNext}
            style={styles.calArrow}
            disabled={isCurrentMonth}
            hitSlop={12}
          >
            <FontAwesome
              name="chevron-right"
              size={14}
              color={isCurrentMonth ? arrowDisabledColor : arrowColor}
            />
          </Pressable>
        </View>
        <Calendar year={viewYear} month={viewMonth} onDayPress={setSelectedDay} />
        <Text style={[styles.calHint, { color: colors.subtext }]}>완료된 날짜를 눌러보세요</Text>
      </View>

      {/* 누적 푸쉬업 카드 */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.totalTopRow}>
          <FontAwesome name="bar-chart" size={18} color={GREEN} />
          <Text style={[styles.totalLabel, { color: colors.subtext }]}>총 누적 푸쉬업</Text>
        </View>
        <Text style={styles.totalNum}>
          {TOTAL_PUSHUPS.toLocaleString()}
          <Text style={styles.totalUnit}> 개</Text>
        </Text>
      </View>

      {selectedDay !== null && WORKOUT_DATA[selectedDay] && (
        <DayPopup
          day={selectedDay}
          month={viewMonth}
          data={WORKOUT_DATA[selectedDay]}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: "800", marginTop: 20, marginBottom: 20 },

  card: { borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1 },

  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  calArrow: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  calTitle: { fontSize: 16, fontWeight: "700" },
  calHint: { fontSize: 12, textAlign: "center", marginTop: 12, opacity: 0.5 },

  streakLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  streakRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  streakFire: { fontSize: 44, lineHeight: 56 },
  streakNum: { color: RED, fontSize: 64, fontWeight: "900", lineHeight: 72 },
  streakSuffix: { flexDirection: "column", alignItems: "flex-start", marginBottom: 8, gap: 2 },
  streakUnit: { fontSize: 22, fontWeight: "700" },
  streakContinue: { fontSize: 14, fontWeight: "600" },

  totalTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  totalLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  totalNum: { color: GREEN, fontSize: 56, fontWeight: "900", lineHeight: 64 },
  totalUnit: { color: "rgba(0,200,83,0.6)", fontSize: 22, fontWeight: "600" },
});
