import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

export type TierVisualId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master";

type PushupIconProps = {
  width?: number;
  height?: number;
  color: string;
  tier: TierVisualId;
};

/** 측면 푸쉬업 — 티어별 실루엣·디테일 */
export function TierPushupIcon({
  width = 118,
  height = 76,
  color,
  tier,
}: PushupIconProps) {
  const footX = tier === "bronze" ? 52 : 46;
  const footY =
    tier === "bronze"
      ? 44
      : tier === "silver"
        ? 42
        : tier === "gold"
          ? 40
          : 39;

  return (
    <Svg width={width} height={height} viewBox="0 0 112 76">
      <Defs>
        <RadialGradient id="gpMasterAura" cx="50%" cy="42%" r="58%">
          <Stop offset="0%" stopColor="#9B30FF" stopOpacity="0.55" />
          <Stop offset="100%" stopColor="#9B30FF" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {tier === "master" && (
        <Ellipse cx="56" cy="34" rx="50" ry="30" fill="url(#gpMasterAura)" />
      )}

      <Line
        x1="4"
        y1="54"
        x2="108"
        y2="54"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth={1.2}
      />

      {tier === "bronze" && (
        <>
          <Path
            d="M12 18 L14 22 M16 14 L18 18"
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.65}
          />
          <Path
            d="M16 52 L22 46 Q34 40 48 42 Q60 44 72 46 Q80 48 86 44"
            stroke={color}
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            opacity={0.38}
          />
        </>
      )}

      {tier === "diamond" && (
        <G opacity={0.9}>
          <Path
            d="M6 10 L10 6 M8 16 L12 12 M4 22 L8 18"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <Path
            d="M102 8 L98 4 M104 14 L100 10"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </G>
      )}

      {/* 다리 */}
      <Path
        d={
          tier === "bronze"
            ? "M18 54 L28 46 Q40 42 52 44"
            : tier === "silver"
              ? "M18 54 L32 46 L46 42"
              : tier === "gold"
                ? "M18 54 L32 45 L46 40"
                : "M18 54 L32 44 L46 39"
        }
        stroke={color}
        strokeWidth={
          tier === "master" ? 3.2 : tier === "diamond" || tier === "platinum" ? 2.75 : 2.45
        }
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={`M18 54 L14 56 M${footX} ${footY} L48 54`}
        stroke={color}
        strokeWidth={2.1}
        fill="none"
        strokeLinecap="round"
      />

      {/* 등·허리 라인 */}
      <Path
        d={
          tier === "bronze"
            ? "M52 44 Q66 48 80 42 Q92 38 98 34"
            : tier === "silver"
              ? "M46 42 Q62 40 78 36 Q90 32 98 30"
              : tier === "gold"
                ? "M46 40 Q64 36 80 32 Q92 28 100 26"
                : tier === "platinum"
                  ? "M44 38 Q66 32 84 28 Q96 24 104 22"
                  : tier === "diamond"
                    ? "M42 36 Q68 28 88 24 Q100 20 106 18"
                    : "M40 34 Q70 24 92 20 Q102 17 108 15"
        }
        stroke={color}
        strokeWidth={
          tier === "master"
            ? 3.4
            : tier === "diamond"
              ? 3
              : tier === "platinum"
                ? 2.85
                : 2.55
        }
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {(tier === "gold" ||
        tier === "platinum" ||
        tier === "diamond" ||
        tier === "master") && (
        <Path
          d={
            tier === "gold"
              ? "M74 34 L82 32 M78 36 L86 34"
              : tier === "platinum"
                ? "M72 32 L86 28 M76 36 L92 32 M80 34 L94 30"
                : tier === "diamond"
                  ? "M70 30 L90 24 M74 34 L96 28 M78 28 L100 22"
                  : "M68 28 L96 18 M72 32 L102 24 M76 26 L106 18 M80 30 L110 22"
          }
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.82}
        />
      )}

      {/* 팔 */}
      <Path
        d={
          tier === "bronze"
            ? "M98 34 Q92 42 90 50 L92 56"
            : "M100 26 L88 44 L92 56"
        }
        stroke={color}
        strokeWidth={2.45}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M92 56 L100 56"
        stroke={color}
        strokeWidth={2.15}
        strokeLinecap="round"
      />

      <Circle
        cx="102"
        cy="28"
        r={tier === "bronze" ? 8 : tier === "master" ? 9 : 7}
        stroke={color}
        strokeWidth={2.15}
        fill="none"
      />

      {tier === "master" && (
        <Path
          d="M90 8 L92 4 L94 8 L96 4 L98 8 L100 4 L102 8 L104 4 L106 8 L108 4 L110 8 L108 12 L102 14 L96 12 L90 10 Z"
          stroke={color}
          strokeWidth={1.7}
          fill="none"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}
