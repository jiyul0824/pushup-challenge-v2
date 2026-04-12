import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#0a0a0a";
const GREEN = "#00C853";

export default function StartTabScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <Text style={styles.title}>푸쉬업 시작</Text>
      <Text style={styles.sub}>세션 화면은 다음 단계에서 연결할 수 있어요</Text>
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
  },
  sub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
});
