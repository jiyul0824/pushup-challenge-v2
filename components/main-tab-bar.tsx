import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/theme";

const GREEN = "#00C853";

const ICON_SIZE = 24;
const FAB_SIZE = 68;
const BOLT_SIZE = 32;

type IconName = ComponentProps<typeof FontAwesome>["name"];

const TAB_ICONS: Record<string, IconName> = {
  home: "home",
  rank: "trophy",
  stats: "bar-chart",
  settings: "cog",
};

/** 탭 바 표시 순서 (가운데 start) */
const TAB_ORDER = ["home", "rank", "start", "stats", "settings"] as const;

export function MainTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const INACTIVE = "rgba(255,255,255,0.42)";

  const activeName = state.routes[state.index]?.name;
  const orderedRoutes = TAB_ORDER.map((name) =>
    state.routes.find((r) => r.name === name),
  ).filter((r): r is NonNullable<typeof r> => r != null);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {orderedRoutes.map((route) => {
          const isFocused = activeName === route.name;

          if (route.name === "start") {
            return (
              <View key={route.key} style={styles.fabSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFocused }}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(route.name); }}
                  style={({ pressed }) => [
                    styles.fab,
                    isFocused && styles.fabActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <FontAwesome name="bolt" size={BOLT_SIZE} color="#ffffff" />
                </Pressable>
              </View>
            );
          }

          const iconName = TAB_ICONS[route.name];
          if (!iconName) return null;

          const color = isFocused ? GREEN : INACTIVE;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(route.name); }}
              style={({ pressed }) => [
                styles.tabSlot,
                pressed && styles.pressed,
              ]}
            >
              <FontAwesome name={iconName} size={ICON_SIZE} color={color} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  tabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    minHeight: 52,
  },
  fabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -36,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActive: {
    transform: [{ scale: 1.04 }],
  },
  pressed: {
    opacity: 0.85,
  },
});
