import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, Text, View } from "react-native";

import { ActionButton, Panel, SectionLabel, UI } from "@/components/rtdb-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useRtdbMonitor, type ActivityType } from "@/hooks/use-rtdb-monitor";
import { formatTime } from "@/lib/rtdb";

const activityIcon: Record<ActivityType, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  read: "south-east",
  connection: "link",
  reconnect: "sync",
  error: "error-outline",
};

const activityColor: Record<ActivityType, string> = {
  read: UI.teal,
  connection: UI.blue,
  reconnect: UI.amber,
  error: UI.coral,
};

export default function ActivityScreen() {
  const monitor = useRtdbMonitor();

  return (
    <ScreenContainer safeAreaClassName="bg-background" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 34 }}>
        <View style={{ marginBottom: 25 }}>
          <Text style={{ color: UI.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1.8 }}>EVENTS / 02</Text>
          <Text style={{ color: UI.ink, fontSize: 30, fontWeight: "900", letterSpacing: -1.1, marginTop: 5 }}>Activity log</Text>
          <Text style={{ color: UI.dim, fontSize: 13, marginTop: 4 }}>Jejak akses data dan health signal</Text>
        </View>

        <SectionLabel action={<Text style={{ color: UI.dim, fontSize: 11 }}>{monitor.logs.length} EVENTS</Text>}>Latest activity</SectionLabel>
        <Panel accent={UI.border} style={{ paddingVertical: 4 }}>
          {monitor.logs.map((entry, index) => {
            const color = activityColor[entry.type];
            return (
              <View key={entry.id} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, borderBottomWidth: index === monitor.logs.length - 1 ? 0 : 1, borderBottomColor: `${UI.border}88` }}>
                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center", marginRight: 11 }}>
                  <MaterialIcons name={activityIcon[entry.type]} size={17} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <Text style={{ color: UI.ink, fontSize: 13, fontWeight: "800", flex: 1 }}>{entry.title}</Text>
                    <Text style={{ color: UI.dim, fontSize: 10 }}>{formatTime(entry.timestamp)}</Text>
                  </View>
                  <Text style={{ color: UI.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{entry.detail}</Text>
                </View>
              </View>
            );
          })}
        </Panel>

        <View style={{ marginTop: 24 }}>
          <SectionLabel>Operational note</SectionLabel>
          <Panel accent={UI.amber}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <MaterialIcons name="info-outline" size={18} color={UI.amber} />
              <Text style={{ flex: 1, color: UI.muted, fontSize: 12, lineHeight: 19 }}>Log disimpan lokal selama sesi aplikasi. Polling berhenti saat layar ditutup dan akan menyambung kembali saat monitor dipasang.</Text>
            </View>
          </Panel>
        </View>

        <View style={{ marginTop: 24 }}>
          <ActionButton label="Force reconnect" onPress={() => void monitor.refresh()} icon="sync-lock" secondary />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
