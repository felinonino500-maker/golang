import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, Text, View } from "react-native";

import { ActionButton, MetricCard, Panel, SectionLabel, StatusBadge, StatusDot, UI } from "@/components/rtdb-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useRtdbMonitor } from "@/hooks/use-rtdb-monitor";
import { formatTime, formatUptime } from "@/lib/rtdb";

function connectionTone(connection: "connected" | "demo" | "offline") {
  if (connection === "connected") return "teal" as const;
  if (connection === "demo") return "amber" as const;
  return "coral" as const;
}

function connectionLabel(connection: "connected" | "demo" | "offline") {
  if (connection === "connected") return "RTDB CONNECTED";
  if (connection === "demo") return "DEMO MODE";
  return "RTDB OFFLINE";
}

export default function OverviewScreen() {
  const monitor = useRtdbMonitor();
  const tone = connectionTone(monitor.connection);

  return (
    <ScreenContainer safeAreaClassName="bg-background" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 34 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26 }}>
          <View>
            <Text style={{ color: UI.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1.8 }}>RTDB / GO</Text>
            <Text style={{ color: UI.ink, fontSize: 30, fontWeight: "900", letterSpacing: -1.1, marginTop: 5 }}>Monitor</Text>
            <Text style={{ color: UI.dim, fontSize: 13, marginTop: 4 }}>Firmware data command center</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 9 }}>
            <StatusBadge label={connectionLabel(monitor.connection)} tone={tone} />
            <Text style={{ color: UI.dim, fontSize: 11 }}>polling · 5s</Text>
          </View>
        </View>

        <Panel accent={monitor.connection === "connected" ? UI.teal : monitor.connection === "demo" ? UI.amber : UI.coral} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <StatusDot color={monitor.connection === "connected" ? UI.teal : monitor.connection === "demo" ? UI.amber : UI.coral} pulse={monitor.connection === "connected"} />
              <Text style={{ color: UI.ink, fontSize: 17, fontWeight: "800" }}>{monitor.connection === "connected" ? "System healthy" : monitor.connection === "demo" ? "Previewing safely" : "Attention required"}</Text>
            </View>
            <Text style={{ color: UI.muted, fontSize: 12, fontFamily: "monospace" }}>{monitor.metrics.deviceId}</Text>
          </View>
          <Text style={{ color: UI.muted, fontSize: 13, lineHeight: 20, marginTop: 15 }}>
            {monitor.connection === "connected"
              ? `Data terakhir masuk ${formatTime(monitor.lastSyncedAt)} dari path /{monitor.path}.`
              : monitor.connection === "demo"
                ? "Endpoint belum mengembalikan data. Dashboard menggunakan payload contoh dan akan mencoba lagi otomatis."
                : "RTDB tidak merespons. Periksa koneksi device atau Firebase Rules sebelum mencoba lagi."}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 17 }}>
            <ActionButton label={monitor.isRefreshing ? "Syncing…" : "Sync now"} onPress={() => void monitor.refresh()} icon="sync" />
            {monitor.error ? <Text style={{ flex: 1, color: UI.coral, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>{monitor.error}</Text> : null}
          </View>
        </Panel>

        <SectionLabel action={<Text style={{ color: UI.dim, fontSize: 11 }}>LIVE SNAPSHOT</Text>}>Firmware health</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingLeft: 20, marginBottom: 26 }}>
          <MetricCard label="Uptime" value={formatUptime(monitor.metrics.uptimeSeconds)} helper="device runtime" icon="schedule" />
          <MetricCard label="Firmware" value={monitor.metrics.firmwareVersion} helper="release channel" icon="memory" tone={UI.blue} />
          <MetricCard label="Latency" value={`${monitor.metrics.latencyMs} ms`} helper="last read" icon="speed" tone={UI.amber} />
          <MetricCard label="Error rate" value={`${monitor.metrics.errorRate.toFixed(1)}%`} helper="read errors" icon="warning-amber" tone={monitor.metrics.errorRate > 5 ? UI.coral : UI.teal} />
        </ScrollView>

        <SectionLabel>Connection detail</SectionLabel>
        <Panel accent={UI.border} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: `${UI.teal}18`, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="cloud-queue" size={20} color={UI.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: UI.ink, fontSize: 14, fontWeight: "800" }}>Firebase Realtime Database</Text>
              <Text style={{ color: UI.dim, fontSize: 11, marginTop: 3 }}>asia-southeast1 · REST adapter</Text>
            </View>
            <Text style={{ color: UI.teal, fontFamily: "monospace", fontSize: 11 }}>v1</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: UI.border, paddingTop: 13, gap: 9 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: UI.dim, fontSize: 12 }}>Endpoint</Text><Text style={{ color: UI.muted, fontFamily: "monospace", fontSize: 11, maxWidth: 220 }} numberOfLines={1}>{monitor.endpoint}</Text></View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: UI.dim, fontSize: 12 }}>Path</Text><Text style={{ color: UI.teal, fontFamily: "monospace", fontSize: 12 }}>/{monitor.path}</Text></View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: UI.dim, fontSize: 12 }}>Last sync</Text><Text style={{ color: UI.muted, fontSize: 12 }}>{formatTime(monitor.lastSyncedAt)}</Text></View>
          </View>
        </Panel>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialIcons name="shield" size={15} color={UI.dim} />
          <Text style={{ flex: 1, color: UI.dim, fontSize: 11, lineHeight: 16 }}>Client config aktif. Akses produksi tetap dikontrol Firebase Rules.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
