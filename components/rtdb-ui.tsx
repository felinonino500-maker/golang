import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const UI = {
  ink: "#F2FAF8",
  muted: "#8EA5A7",
  dim: "#627B7E",
  bg: "#07131A",
  panel: "#10232B",
  panelRaised: "#14303A",
  border: "#1D3A43",
  teal: "#32D1C2",
  amber: "#F4B860",
  coral: "#FF6B5E",
  blue: "#7AA8FF",
};

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{children}</Text>
      {action}
    </View>
  );
}

export function StatusDot({ color = UI.teal, pulse = false }: { color?: string; pulse?: boolean }) {
  return (
    <View style={[styles.dotRing, pulse && styles.dotPulse, { borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

export function StatusBadge({ label, tone = "teal", icon }: { label: string; tone?: "teal" | "amber" | "coral" | "blue"; icon?: IconName }) {
  const color = tone === "amber" ? UI.amber : tone === "coral" ? UI.coral : tone === "blue" ? UI.blue : UI.teal;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}45` }]}>
      {icon ? <MaterialIcons name={icon} size={13} color={color} /> : <StatusDot color={color} />}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Panel({ children, accent = UI.border, style }: { children: ReactNode; accent?: string; style?: object }) {
  return <View style={[styles.panel, { borderLeftColor: accent }, style]}>{children}</View>;
}

export function MetricCard({ label, value, helper, icon, tone = UI.teal }: { label: string; value: string; helper?: string; icon: IconName; tone?: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <MaterialIcons name={icon} size={16} color={tone} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {helper ? <Text style={styles.metricHelper}>{helper}</Text> : null}
    </View>
  );
}

export function ActionButton({ label, onPress, icon = "refresh", secondary = false }: { label: string; onPress: () => void; icon?: IconName; secondary?: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.actionButton, secondary ? styles.actionSecondary : styles.actionPrimary]}
    >
      <MaterialIcons name={icon} size={17} color={secondary ? UI.teal : UI.bg} />
      <Text style={[styles.actionText, { color: secondary ? UI.teal : UI.bg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ icon, title, detail }: { icon: IconName; title: string; detail: string }) {
  return (
    <View style={styles.emptyState}>
      <MaterialIcons name={icon} size={26} color={UI.dim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionLabel: { color: UI.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.7, textTransform: "uppercase" },
  dotRing: { width: 16, height: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 8 },
  dotPulse: { shadowColor: UI.teal, shadowOpacity: 0.85, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badge: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 7, paddingHorizontal: 9 },
  badgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  panel: { backgroundColor: UI.panel, borderWidth: 1, borderColor: UI.border, borderLeftWidth: 3, borderRadius: 15, padding: 16 },
  metricCard: { width: 142, minHeight: 98, backgroundColor: UI.panel, borderColor: UI.border, borderWidth: 1, borderRadius: 13, padding: 13, marginRight: 9 },
  metricTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricLabel: { color: UI.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  metricValue: { color: UI.ink, fontSize: 23, fontWeight: "800", marginTop: 11, letterSpacing: -0.4 },
  metricHelper: { color: UI.dim, fontSize: 11, marginTop: 3 },
  actionButton: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingHorizontal: 15 },
  actionPrimary: { backgroundColor: UI.teal },
  actionSecondary: { backgroundColor: `${UI.teal}12`, borderColor: `${UI.teal}55`, borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.25 },
  emptyState: { alignItems: "center", padding: 28, gap: 8 },
  emptyTitle: { color: UI.ink, fontSize: 15, fontWeight: "800" },
  emptyDetail: { color: UI.muted, fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 280 },
});
