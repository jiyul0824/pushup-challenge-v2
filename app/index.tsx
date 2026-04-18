import { useRouter, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Index() {
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return; // navigation 준비될 때까지 대기

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        router.replace(profile ? "/(tabs)/home" : "/onboarding");
      } else {
        router.replace("/welcome");
      }
    })();
  }, [navState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#00C853" size="large" />
    </View>
  );
}
