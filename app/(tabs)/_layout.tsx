import { Tabs } from "expo-router";

import { MainTabBar } from "../../components/main-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="rank" />
      <Tabs.Screen name="start" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
