import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { type TierVisualId } from "../constants/tiers";

const TIER_KEY = "@tier";

// 하위 호환성을 위해 타입은 유지 — 항상 "light"
export type Theme = "dark" | "light";

export type ThemeColors = {
  bg: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  inputBg: string;
};

/**
 * 티어별 배경 팔레트
 * 배경은 티어 색을 확실히 알 수 있도록 충분히 채도 있는 색상 사용
 * 카드는 흰색 — 배경과 강한 대비로 콘텐츠가 눈에 잘 띔
 */
const TIER_COLORS: Record<TierVisualId, ThemeColors> = {
  bronze: {
    bg:      "#0a0a0a",
    card:    "#141414",
    text:    "#FFFFFF",
    subtext: "rgba(255,255,255,0.55)",
    border:  "#2a2a2a",
    inputBg: "#1a1a1a",
  },
  silver: {
    bg:      "#0a0a0a",
    card:    "#141414",
    text:    "#FFFFFF",
    subtext: "rgba(255,255,255,0.55)",
    border:  "#2a2a2a",
    inputBg: "#1a1a1a",
  },
  gold: {
    bg:      "#0a0a0a",
    card:    "#141414",
    text:    "#FFFFFF",
    subtext: "rgba(255,255,255,0.55)",
    border:  "#2a2a2a",
    inputBg: "#1a1a1a",
  },
  platinum: {
    bg:      "#0a0a0a",
    card:    "#141414",
    text:    "#FFFFFF",
    subtext: "rgba(255,255,255,0.55)",
    border:  "#2a2a2a",
    inputBg: "#1a1a1a",
  },
  diamond: {
    bg:      "#0a0a0a",
    card:    "#141414",
    text:    "#FFFFFF",
    subtext: "rgba(255,255,255,0.55)",
    border:  "#2a2a2a",
    inputBg: "#1a1a1a",
  },
  master: {
    bg:      "#0a0a0a",
    card:    "#141414",
    text:    "#FFFFFF",
    subtext: "rgba(255,255,255,0.55)",
    border:  "#2a2a2a",
    inputBg: "#1a1a1a",
  },
};

type ThemeContextType = {
  theme: Theme;            // 항상 "light" — 하위 호환성 유지
  colors: ThemeColors;
  toggleTheme: () => void; // no-op — 하위 호환성 유지
  setTierTheme: (tier: TierVisualId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme:        "light",
  colors:       TIER_COLORS.bronze,
  toggleTheme:  () => {},
  setTierTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<TierVisualId>("bronze");

  useEffect(() => {
    AsyncStorage.getItem(TIER_KEY).then(saved => {
      if (saved) setTier(saved as TierVisualId);
    });
  }, []);

  function setTierTheme(t: TierVisualId) {
    setTier(t);
    AsyncStorage.setItem(TIER_KEY, t);
  }

  return (
    <ThemeContext.Provider value={{
      theme:       "light",
      colors:      TIER_COLORS[tier],
      toggleTheme: () => {},
      setTierTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
