import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../contexts/theme";

const TRACK_W = 60;
const TRACK_H = 32;
const CIRCLE = 26;
const PAD = 3;
const TRAVEL = TRACK_W - CIRCLE - PAD * 2;

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PAD, PAD + TRAVEL],
  });

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleTheme();
      }}
      style={styles.btn}
      hitSlop={12}
    >
      {/* 트랙 */}
      <View style={[styles.track, { backgroundColor: isDark ? "#1c3a4a" : "#fde68a" }]}>
        {/* 슬라이딩 원 */}
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ translateX }],
              backgroundColor: isDark ? "#38bdf8" : "#f59e0b",
            },
          ]}
        >
          <FontAwesome
            name={isDark ? "moon-o" : "sun-o"}
            size={13}
            color="#ffffff"
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {},
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: "center",
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
