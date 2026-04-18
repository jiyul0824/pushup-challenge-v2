import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { supabase } from "../lib/supabase";
import { useTheme } from "../../contexts/theme";
import { type TierVisualId } from "../../constants/tiers";

const GREEN   = "#00C853";
const RED     = "#FF3B30";
const APP_VER = "1.0.0";

const TIER_COLORS: Record<TierVisualId, string> = {
  bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#20B2AA", diamond: "#44CCFF", master: "#9B30FF",
};
const TIER_LABELS: Record<TierVisualId, string> = {
  bronze: "브론즈", silver: "실버", gold: "골드",
  platinum: "플래티넘", diamond: "다이아몬드", master: "마스터",
};
const AVATAR_PALETTE = [
  "#7c3aed", "#db2777", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#4f46e5", "#0d9488",
];
function avatarBg(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

/* ── 스토리지 키 ── */
const BODY_STORAGE   = "@body_info";
const AVATAR_STORAGE = "@avatar_uri";

type BodyInfo  = { height: string; weight: string; age: string };
type EditField = keyof BodyInfo;

/* ── 편집 모달 타입 ── */
type ModalType =
  | { kind: "body";     field: EditField; label: string; unit: string }
  | { kind: "nickname" };

export default function SettingsTabScreen() {
  const insets = useSafeAreaInsets();
  const { colors, setTierTheme } = useTheme();
  const router = useRouter();

  /* 프로필 */
  const [nickname,  setNickname]  = useState("챌린저");
  const [tier,      setTier]      = useState<TierVisualId>("bronze");
  const [streak,    setStreak]    = useState(0);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [userId,    setUserId]    = useState<string | null>(null);

  /* 내 정보 */
  const [body, setBody] = useState<BodyInfo>({ height: "", weight: "", age: "" });

  /* 앱 설정 */
  const [notiEnabled, setNotiEnabled] = useState(true);

  /* 편집 모달 */
  const [modal,      setModal]     = useState<ModalType | null>(null);
  const [editValue,  setEditValue] = useState("");
  const slideAnim = useRef(new Animated.Value(400)).current;

  /* ── 초기 로드 ── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("nickname, tier, streak")
        .eq("id", user.id)
        .single();
      if (data) {
        const t = (data.tier ?? "bronze") as TierVisualId;
        setNickname(data.nickname ?? "챌린저");
        setTier(t);
        setStreak(data.streak ?? 0);
        setTierTheme(t);
      }

      const saved = await AsyncStorage.getItem(BODY_STORAGE);
      if (saved) setBody(JSON.parse(saved));

      const uri = await AsyncStorage.getItem(AVATAR_STORAGE);
      if (uri) setAvatarUri(uri);
    })();
  }, []);

  /* ── 모달 열기/닫기 ── */
  function openModal(m: ModalType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (m.kind === "body")     setEditValue(body[m.field]);
    if (m.kind === "nickname") setEditValue(nickname);
    setModal(m);
    slideAnim.setValue(400);
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220,
    }).start();
  }
  function closeModal() {
    Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true })
      .start(() => setModal(null));
  }

  /* ── 저장 ── */
  async function saveModal() {
    if (!modal) return;
    if (modal.kind === "body") {
      const updated = { ...body, [modal.field]: editValue };
      setBody(updated);
      await AsyncStorage.setItem(BODY_STORAGE, JSON.stringify(updated));
    } else if (modal.kind === "nickname") {
      const trimmed = editValue.trim();
      if (!trimmed) { Alert.alert("닉네임을 입력해주세요."); return; }
      setNickname(trimmed);
      if (userId) await supabase.from("profiles").update({ nickname: trimmed }).eq("id", userId);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  }

  /* ── 프로필 사진 선택 ── */
  async function pickAvatar() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_STORAGE, uri);
    }
  }

  /* ── 로그아웃 ── */
  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("로그아웃", "정말 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃", style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/welcome");
        },
      },
    ]);
  }

  /* ── 문의 ── */
  function handleContact() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("문의하기", "support@pushupchallenge.app\n으로 메일을 보내주세요.", [{ text: "확인" }]);
  }

  const tierColor = TIER_COLORS[tier];
  const ac        = avatarBg(nickname);
  const subColor = colors.subtext;
  const divColor = "rgba(0,0,0,0.07)";

  /* ── 내 정보 항목 정의 ── */
  const BODY_FIELDS: { field: EditField; label: string; unit: string; icon: string; placeholder: string }[] = [
    { field: "height", label: "키",    unit: "cm", icon: "arrows-v",       placeholder: "예) 175" },
    { field: "weight", label: "몸무게", unit: "kg", icon: "balance-scale",  placeholder: "예) 70"  },
    { field: "age",    label: "나이",   unit: "세", icon: "user",           placeholder: "예) 25"  },
  ];

  /* ── 모달 텍스트 ── */
  const modalLabel = modal?.kind === "nickname"
    ? "닉네임"
    : modal?.kind === "body" ? modal.label : "";
  const modalUnit  = modal?.kind === "body" ? modal.unit : "";
  const modalPlaceholder = modal?.kind === "nickname"
    ? "새 닉네임 입력"
    : modal?.kind === "body"
      ? BODY_FIELDS.find(f => f.field === modal.field)?.placeholder ?? ""
      : "";

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>설정</Text>

        {/* ─── 프로필 카드 ─── */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: `${tierColor}55` }]}>
          <View style={[styles.profileBgAccent, { backgroundColor: `${tierColor}10` }]} />

          {/* 아바타 (탭 → 사진 변경) */}
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.avatarCircle, { borderColor: `${tierColor}88` }]} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: ac, borderColor: `${tierColor}88` }]}>
                <Text style={styles.avatarText}>{nickname[0]}</Text>
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: GREEN }]}>
              <FontAwesome name="camera" size={9} color="#000" />
            </View>
          </Pressable>

          {/* 프로필 정보 */}
          <View style={styles.profileInfo}>
            <Pressable
              style={styles.nicknameRow}
              onPress={() => openModal({ kind: "nickname" })}
            >
              <Text style={[styles.profileName, { color: colors.text }]}>{nickname}</Text>
              <View style={[styles.editPill, { backgroundColor: `${GREEN}18`, borderColor: `${GREEN}40` }]}>
                <FontAwesome name="pencil" size={9} color={GREEN} />
                <Text style={styles.editPillText}>수정</Text>
              </View>
            </Pressable>
            <View style={[styles.tierBadge, { backgroundColor: `${tierColor}18`, borderColor: `${tierColor}50` }]}>
              <FontAwesome name="trophy" size={10} color={tierColor} />
              <Text style={[styles.tierBadgeText, { color: tierColor }]}>{TIER_LABELS[tier]}</Text>
            </View>
          </View>

          {/* 연속 달성 */}
          <View style={[styles.streakBox, { backgroundColor: `${tierColor}12`, borderColor: `${tierColor}40` }]}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakNum, { color: tierColor }]}>{streak}</Text>
            <Text style={[styles.streakLabel, { color: subColor }]}>연속</Text>
          </View>
        </View>

        {/* ─── 내 정보 ─── */}
        <Text style={[styles.sectionTitle, { color: subColor }]}>내 정보</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {BODY_FIELDS.map(({ field, label, unit, icon }, idx) => (
            <Pressable
              key={field}
              style={({ pressed }) => [
                styles.infoRow,
                idx < BODY_FIELDS.length - 1 && { borderBottomWidth: 1, borderBottomColor: divColor },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => openModal({ kind: "body", field, label, unit })}
            >
              <View style={styles.infoLeft}>
                <View style={[styles.iconWrap, { backgroundColor: `${GREEN}18` }]}>
                  <FontAwesome name={icon as any} size={13} color={GREEN} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
                  {body[field] ? (
                    <Text style={[styles.infoCurrentVal, { color: GREEN }]}>
                      현재 {body[field]}{unit}
                    </Text>
                  ) : (
                    <Text style={[styles.infoCurrentVal, { color: subColor }]}>미설정</Text>
                  )}
                </View>
              </View>
              <View style={styles.infoRight}>
                {body[field] ? (
                  <Text style={[styles.infoValueBig, { color: colors.text }]}>
                    {body[field]}
                    <Text style={[styles.infoUnit, { color: subColor }]}>{unit}</Text>
                  </Text>
                ) : null}
                <FontAwesome name="chevron-right" size={11} color={subColor} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* ─── 앱 설정 ─── */}
        <Text style={[styles.sectionTitle, { color: subColor }]}>앱 설정</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* 알림 */}
          <View style={styles.settingRow}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(249,115,22,0.12)" }]}>
                <FontAwesome name="bell" size={13} color="#f97316" />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.text }]}>푸시 알림</Text>
                <Text style={[styles.infoCurrentVal, { color: subColor }]}>매일 운동 리마인더</Text>
              </View>
            </View>
            <Switch
              value={notiEnabled}
              onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotiEnabled(v); }}
              trackColor={{ false: "#ddd", true: `${GREEN}80` }}
              thumbColor={notiEnabled ? GREEN : "#f4f4f4"}
            />
          </View>
        </View>

        {/* ─── 기타 ─── */}
        <Text style={[styles.sectionTitle, { color: subColor }]}>기타</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* 문의하기 */}
          <Pressable
            style={({ pressed }) => [
              styles.infoRow,
              { borderBottomWidth: 1, borderBottomColor: divColor },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleContact}
          >
            <View style={styles.infoLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(14,165,233,0.12)" }]}>
                <FontAwesome name="envelope" size={12} color="#0ea5e9" />
              </View>
              <Text style={[styles.infoLabel, { color: colors.text }]}>문의하기</Text>
            </View>
            <FontAwesome name="chevron-right" size={11} color={subColor} />
          </Pressable>

          {/* 앱 버전 */}
          <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: divColor }]}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${GREEN}18` }]}>
                <FontAwesome name="info-circle" size={13} color={GREEN} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.text }]}>앱 버전</Text>
            </View>
            <Text style={[styles.versionText, { color: subColor }]}>v{APP_VER}</Text>
          </View>

          {/* 로그아웃 */}
          <Pressable
            style={({ pressed }) => [styles.infoRow, pressed && { opacity: 0.7 }]}
            onPress={handleLogout}
          >
            <View style={styles.infoLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(255,59,48,0.12)" }]}>
                <FontAwesome name="sign-out" size={13} color={RED} />
              </View>
              <Text style={[styles.infoLabel, { color: RED }]}>로그아웃</Text>
            </View>
            <FontAwesome name="chevron-right" size={11} color={RED} />
          </Pressable>
        </View>
      </ScrollView>

      {/* ─── 편집 바텀시트 모달 ─── */}
      {modal && (
        <Modal transparent animationType="fade" onRequestClose={closeModal}>
          <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); closeModal(); }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
                onStartShouldSetResponder={() => true}
              >
                <View style={[styles.sheetHandle, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{modalLabel} 수정</Text>

                <View style={[styles.inputRow, { backgroundColor: "rgba(0,0,0,0.04)", borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType={modal.kind === "body" ? "numeric" : "default"}
                    placeholder={modalPlaceholder}
                    placeholderTextColor={subColor}
                    autoFocus
                    maxLength={modal.kind === "nickname" ? 12 : 5}
                    returnKeyType="done"
                    onSubmitEditing={saveModal}
                  />
                  {modalUnit ? (
                    <Text style={[styles.inputUnit, { color: subColor }]}>{modalUnit}</Text>
                  ) : null}
                </View>

                <View style={styles.sheetBtns}>
                  <Pressable
                    style={[styles.sheetBtn, { backgroundColor: "rgba(0,0,0,0.06)" }]}
                    onPress={closeModal}
                  >
                    <Text style={[styles.sheetBtnText, { color: colors.text }]}>취소</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sheetBtn, { backgroundColor: GREEN }]}
                    onPress={saveModal}
                  >
                    <Text style={[styles.sheetBtnText, { color: "#000" }]}>저장</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, fontWeight: "900", marginTop: 20, marginBottom: 24 },

  /* 프로필 카드 */
  profileCard: {
    borderRadius: 22, borderWidth: 1.5,
    padding: 20, flexDirection: "row", alignItems: "center", gap: 14,
    marginBottom: 28, overflow: "hidden", position: "relative",
  },
  profileBgAccent: {
    position: "absolute", top: 0, right: 0,
    width: 160, height: 160, borderRadius: 80,
    transform: [{ translateX: 50 }, { translateY: -50 }],
  },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center", borderWidth: 2.5,
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  avatarEditBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  profileInfo: { flex: 1, gap: 8 },
  nicknameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 20, fontWeight: "900" },
  editPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 20, borderWidth: 1,
  },
  editPillText: { color: GREEN, fontSize: 10, fontWeight: "700" },
  tierBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 20, borderWidth: 1,
  },
  tierBadgeText: { fontSize: 11, fontWeight: "700" },
  streakBox: {
    alignItems: "center", paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 1, gap: 1,
  },
  streakFire: { fontSize: 18 },
  streakNum: { fontSize: 22, fontWeight: "900" },
  streakLabel: { fontSize: 10, fontWeight: "700" },

  /* 섹션 */
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 },
  card: { borderRadius: 18, borderWidth: 1, marginBottom: 28, overflow: "hidden" },

  /* 행 */
  infoRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 18,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoTextCol: { gap: 2 },
  infoLabel: { fontSize: 15, fontWeight: "600" },
  infoCurrentVal: { fontSize: 11, fontWeight: "600" },
  infoValueBig: { fontSize: 15, fontWeight: "700" },
  infoUnit: { fontSize: 12, fontWeight: "500" },
  settingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 13, paddingHorizontal: 18,
  },
  versionText: { fontSize: 14, fontWeight: "600" },

  /* 바텀시트 모달 */
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderWidth: 1, borderBottomWidth: 0,
    padding: 24, paddingBottom: 36, gap: 18,
  },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 2 },
  sheetTitle: { fontSize: 18, fontWeight: "800" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14, gap: 8,
  },
  input: { flex: 1, fontSize: 20, fontWeight: "700" },
  inputUnit: { fontSize: 16, fontWeight: "600" },
  sheetBtns: { flexDirection: "row", gap: 10 },
  sheetBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  sheetBtnText: { fontSize: 16, fontWeight: "800" },
});
