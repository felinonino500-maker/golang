import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, Text, View } from "react-native";

import { ActionButton, EmptyState, Panel, SectionLabel, StatusBadge, UI } from "@/components/rtdb-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useRtdbMonitor } from "@/hooks/use-rtdb-monitor";
import { formatTime, getPayloadRows } from "@/lib/rtdb";

export default function LiveDataScreen() {
  const monitor = useRtdbMonitor();
  const rows = getPayloadRows(monitor.payload);

  return (
    <ScreenContainer safeAreaClassName="bg-background" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 34 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: UI.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1.8 }}>STREAM / 01</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 5 }}>
            <View>
              <Text style={{ color: UI.ink, fontSize: 30, fontWeight: "900", letterSpacing: -1.1 }}>Live data</Text>
              <Text style={{ color: UI.dim, fontSize: 13, marginTop: 4 }}>Payload terbaru dari /{monitor.path}</Text>
            </View>
            <StatusBadge label={monitor.connection === "connected" ? "LIVE" : "CACHED"} tone={monitor.connection === "connected" ? "teal" : "amber"} icon="sensors" />
          </View>
        </View>

        <Panel accent={UI.teal} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialIcons name="data-object" size={18} color={UI.teal} />
              <Text style={{ color: UI.ink, fontSize: 15, fontWeight: "800" }}>Firmware payload</Text>
            </View>
            <Text style={{ color: UI.dim, fontSize: 11 }}>{formatTime(monitor.lastSyncedAt)}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: UI.border, marginBottom: 2 }} />
          {rows.length ? rows.map((row) => (
            <View key={row.key} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: `${UI.border}88` }}>
              <Text style={{ width: 105, color: UI.teal, fontFamily: "monospace", fontSize: 12 }}>{row.key}</Text>
              <Text style={{ flex: 1, color: UI.ink, fontFamily: "monospace", fontSize: 12, lineHeight: 18 }} numberOfLines={3}>{row.value}</Text>
              <Text style={{ color: UI.dim, fontSize: 10, marginLeft: 5 }}>{row.kind}</Text>
            </View>
          )) : <EmptyState icon="data-object" title="Payload kosong" detail="RTDB mengembalikan null pada path ini." />}
        </Panel>

        <SectionLabel action={<Text style={{ color: UI.teal, fontSize: 11 }}>{monitor.changes.length} CHANGED</Text>}>Change feed</SectionLabel>
        <Panel accent={UI.amber} style={{ marginBottom: 20 }}>
          {monitor.changes.length ? monitor.changes.map((field) => (
            <View key={field} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: `${UI.border}88` }}>
              <MaterialIcons name="south-east" size={15} color={UI.amber} />
              <Text style={{ color: UI.ink, fontFamily: "monospace", fontSize: 12 }}>{field}</Text>
              <Text style={{ color: UI.dim, fontSize: 11, marginLeft: "auto" as never }}>updated</Text>
            </View>
          )) : <Text style={{ color: UI.muted, fontSize: 13, lineHeight: 19 }}>Belum ada field berubah sejak monitor dimulai.</Text>}
        </Panel>

        <ActionButton label={monitor.isRefreshing ? "Reading RTDB…" : "Read again"} onPress={() => void monitor.refresh()} icon="sync" secondary />
        {monitor.error ? <Text style={{ color: UI.coral, fontSize: 12, lineHeight: 18, marginTop: 14 }}>{monitor.error}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}
