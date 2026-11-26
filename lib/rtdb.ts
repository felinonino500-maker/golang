export const firebaseConfig = {
  apiKey: "AIzaSyAvWCSjfvz4R5kduVDtTiPiPrY-nUJki6o",
  authDomain: "bizflow-dashboard-vlo72.firebaseapp.com",
  databaseURL: "https://bizflow-dashboard-vlo72-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bizflow-dashboard-vlo72",
  storageBucket: "bizflow-dashboard-vlo72.firebasestorage.app",
  messagingSenderId: "990621443349",
  appId: "1:990621443349:web:28862100601443d3a2751c",
} as const;

export const DEFAULT_RTDB_PATH = "firmware";
export const DEFAULT_POLL_INTERVAL_MS = 5000;

function getGoApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const current = new URL(window.location.origin);
    if (current.hostname.startsWith("8081-")) {
      current.hostname = `3000-${current.hostname.slice(5)}`;
    } else if (current.port === "8081") {
      current.port = "3000";
    }
    return current.origin;
  }

  return "http://127.0.0.1:3000";
}

export type FirmwareStatus = "online" | "offline" | "unknown";

export type FirmwareMetrics = {
  status: FirmwareStatus;
  firmwareVersion: string;
  uptimeSeconds: number;
  latencyMs: number;
  readCount: number;
  errorRate: number;
  updatedAt: string;
  deviceId: string;
};

export type RtdbReadResult = {
  payload: unknown;
  latencyMs: number;
  requestedAt: string;
};

export const DEMO_PAYLOAD = {
  deviceId: "GO-EDGE-042",
  status: "online",
  firmwareVersion: "v1.8.4",
  uptimeSeconds: 184320,
  readCount: 12846,
  errorRate: 0.7,
  lastSeen: new Date(Date.now() - 12000).toISOString(),
  telemetry: {
    temperature: 42.6,
    voltage: 3.31,
    rssi: -61,
  },
};

function cleanPath(path: string) {
  return path.trim().replace(/^\/+|\/+$/g, "");
}

function toFiniteNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function readCandidate(payload: unknown, candidates: string[]) {
  if (!payload || typeof payload !== "object") return undefined;
  for (const candidate of candidates) {
    const value = candidate.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, payload);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function parseStatus(value: unknown): FirmwareStatus {
  if (value === true) return "online";
  if (value === false) return "offline";
  const normalized = String(value ?? "").toLowerCase();
  if (["online", "connected", "ready", "ok", "active"].includes(normalized)) return "online";
  if (["offline", "disconnected", "error", "inactive"].includes(normalized)) return "offline";
  return "unknown";
}

export function buildRtdbUrl(path: string = DEFAULT_RTDB_PATH) {
  const safePath = cleanPath(path);
  return safePath ? `${firebaseConfig.databaseURL}/${safePath}.json` : `${firebaseConfig.databaseURL}.json`;
}

export async function readRtdbPath(
  path: string = DEFAULT_RTDB_PATH,
  signal?: AbortSignal,
): Promise<RtdbReadResult> {
  const startedAt = Date.now();
  const requestedAt = new Date(startedAt).toISOString();
  const response = await fetch(`${getGoApiBaseUrl()}/api/firmware?path=${encodeURIComponent(cleanPath(path))}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`RTDB ${response.status}: ${response.statusText || "request ditolak"}`);
  }

  const result = await response.json() as { payload?: unknown; error?: string };
  if (result.error) throw new Error(result.error);
  return { payload: result.payload ?? null, latencyMs: Math.max(1, Date.now() - startedAt), requestedAt };
}

export function normalizeFirmwarePayload(payload: unknown, latencyMs: number): FirmwareMetrics {
  const statusValue = readCandidate(payload, ["status", "online", "isOnline", "connection.status"]);
  const uptime = toFiniteNumber(readCandidate(payload, ["uptimeSeconds", "uptime", "metrics.uptimeSeconds", "metrics.uptime"]), 0);
  const errorRateRaw = toFiniteNumber(readCandidate(payload, ["errorRate", "metrics.errorRate", "errors.rate"]), 0);
  const errorRate = errorRateRaw <= 1 ? errorRateRaw * 100 : errorRateRaw;
  const updatedAtValue = readCandidate(payload, ["updatedAt", "lastSeen", "timestamp", "metadata.updatedAt"]);

  return {
    status: parseStatus(statusValue),
    firmwareVersion: toStringValue(
      readCandidate(payload, ["firmwareVersion", "version", "firmware.version", "metadata.version"]),
      "—",
    ),
    uptimeSeconds: uptime,
    latencyMs,
    readCount: toFiniteNumber(readCandidate(payload, ["readCount", "reads", "metrics.readCount"]), 0),
    errorRate,
    updatedAt: toStringValue(updatedAtValue, new Date().toISOString()),
    deviceId: toStringValue(readCandidate(payload, ["deviceId", "device.id", "id"]), "UNASSIGNED"),
  };
}

export function formatUptime(totalSeconds: number) {
  if (!totalSeconds) return "—";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatTime(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function getPayloadRows(payload: unknown) {
  if (!payload || typeof payload !== "object") return [] as Array<{ key: string; value: string; kind: string }>;
  return Object.entries(payload as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: typeof value === "object" ? JSON.stringify(value) : String(value ?? "null"),
    kind: Array.isArray(value) ? "array" : typeof value,
  }));
}
