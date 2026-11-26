import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_RTDB_PATH,
  DEMO_PAYLOAD,
  normalizeFirmwarePayload,
  readRtdbPath,
  type FirmwareMetrics,
} from "@/lib/rtdb";

export type ActivityType = "read" | "connection" | "reconnect" | "error";

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  timestamp: string;
};

type ConnectionMode = "connected" | "demo" | "offline";

type MonitorState = {
  payload: unknown;
  metrics: FirmwareMetrics;
  connection: ConnectionMode;
  isRefreshing: boolean;
  lastSyncedAt: string;
  error: string | null;
  changes: string[];
  logs: ActivityEntry[];
};

function makeLog(type: ActivityType, title: string, detail: string): ActivityEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    detail,
    timestamp: new Date().toISOString(),
  };
}

function changedKeys(previous: unknown, next: unknown) {
  if (!previous || !next || typeof previous !== "object" || typeof next !== "object") return [];
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return [...keys].filter((key) => JSON.stringify((previous as Record<string, unknown>)[key]) !== JSON.stringify((next as Record<string, unknown>)[key])).slice(0, 6);
}

const initialTime = new Date(Date.now() - 12000).toISOString();

export function useRtdbMonitor(path: string = DEFAULT_RTDB_PATH, pollInterval = DEFAULT_POLL_INTERVAL_MS) {
  const hasConnectedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<MonitorState>(() => ({
    payload: DEMO_PAYLOAD,
    metrics: normalizeFirmwarePayload(DEMO_PAYLOAD, 86),
    connection: "demo",
    isRefreshing: false,
    lastSyncedAt: initialTime,
    error: null,
    changes: ["telemetry", "lastSeen"],
    logs: [
      makeLog("connection", "Demo payload loaded", "Menunggu pembacaan pertama dari RTDB."),
    ],
  }));

  const refresh = useCallback(async (isInitial = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) => ({ ...current, isRefreshing: true }));

    try {
      const result = await readRtdbPath(path, controller.signal);
      if (controller.signal.aborted) return;
      if (result.payload === null) {
        setState((current) => ({
          ...current,
          payload: DEMO_PAYLOAD,
          metrics: normalizeFirmwarePayload(DEMO_PAYLOAD, result.latencyMs),
          connection: "demo",
          isRefreshing: false,
          lastSyncedAt: result.requestedAt,
          error: `Path /${path} belum memiliki payload.`,
          changes: ["demo payload"],
          logs: [
            makeLog("connection", "RTDB path empty", `/${path} mengembalikan null; demo payload ditampilkan.`),
            ...current.logs,
          ].slice(0, 40),
        }));
        return;
      }
      const nextMetrics = normalizeFirmwarePayload(result.payload, result.latencyMs);
      setState((current) => {
        const wasConnected = current.connection === "connected";
        const changes = changedKeys(current.payload, result.payload);
        const event = wasConnected
          ? makeLog("read", "RTDB read complete", `${result.latencyMs} ms · ${changes.length || "no"} field changed`)
          : makeLog("reconnect", "RTDB connection restored", `${result.latencyMs} ms · path /${path}`);
        return {
          ...current,
          payload: result.payload,
          metrics: nextMetrics,
          connection: "connected",
          isRefreshing: false,
          lastSyncedAt: result.requestedAt,
          error: null,
          changes,
          logs: [event, ...current.logs].slice(0, 40),
        };
      });
      hasConnectedRef.current = true;
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : "RTDB request failed";
      setState((current) => ({
        ...current,
        connection: hasConnectedRef.current ? "offline" : "demo",
        isRefreshing: false,
        error: message,
        logs: [
          makeLog(
            hasConnectedRef.current ? "error" : "connection",
            hasConnectedRef.current ? "RTDB read failed" : "Demo mode active",
            hasConnectedRef.current ? message : "Endpoint belum mengembalikan payload; menampilkan data contoh.",
          ),
          ...current.logs,
        ].slice(0, 40),
      }));
    }
  }, [path]);

  useEffect(() => {
    void refresh(true);
    const intervalId = setInterval(() => void refresh(false), pollInterval);
    return () => {
      clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, [pollInterval, refresh]);

  return {
    ...state,
    refresh: () => refresh(false),
    path,
    endpoint: "bizflow-dashboard-vlo72-default-rtdb.asia-southeast1.firebasedatabase.app",
  };
}
