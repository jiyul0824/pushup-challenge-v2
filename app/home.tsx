import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#0a0a0a";
const GREEN = "#00C853";

/** 초기 설정 완료 후 이동하는 임시 메인 화면 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <Text style={styles.title}>PUSHUP CHALLENGE</Text>
      <Text style={styles.sub}>초기 설정이 완료되었습니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: GREEN,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
    marginTop: 12,
  },
});
