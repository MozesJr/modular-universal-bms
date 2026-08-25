import { useEffect, useState } from 'react';
import { getSocket, joinPackRoom, leavePackRoom } from 'services/socket';

export interface CellMetrics {
  voltage: number;
  current: number;
  temperature: number | null;
  soc: number | null;
  soh: number | null;
}

export interface PackMetrics {
  voltage: number | null;
  current: number | null;
  temperature: number | null;
  soc: number | null;
  soh: number | null;
}

// Matches the `event` object built in backend/src/services/mqttService.js —
// emitted as-is for both "cell:update" and "cell:alert".
export interface CellUpdateEvent {
  bms_id: string;
  pack_id: string;
  cell_id: number;
  timestamp: string;
  metrics: CellMetrics;
  pack_metrics: PackMetrics;
  state: string;
  alerts: string[];
  pack_voltage_delta_mv: number;
  pack_imbalanced: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UsePackRealtimeResult {
  cells: Map<number, CellUpdateEvent>;
  connectionStatus: ConnectionStatus;
  latestAlert: CellUpdateEvent | null;
}

export const usePackRealtime = (packId: string | undefined): UsePackRealtimeResult => {
  const [cells, setCells] = useState<Map<number, CellUpdateEvent>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [latestAlert, setLatestAlert] = useState<CellUpdateEvent | null>(null);

  useEffect(() => {
    if (!packId) return;

    const socket = getSocket();
    setCells(new Map());
    setLatestAlert(null);
    setConnectionStatus(socket.connected ? 'connected' : 'connecting');

    const handleConnect = () => {
      setConnectionStatus('connected');
      // Room membership doesn't survive a reconnect server-side, so
      // re-join every time — the backend re-checks access on every
      // join:pack call (see middleware/auth.js#resolvePackAccess), so this
      // also re-validates access on reconnect, not just on first mount.
      joinPackRoom(packId);
    };
    const handleDisconnect = () => setConnectionStatus('disconnected');
    // Auth failures (missing/expired token — see services/socket.ts) land
    // here instead of "connect": without this, a rejected connection would
    // leave connectionStatus stuck on "connecting" forever.
    const handleConnectError = () => setConnectionStatus('disconnected');

    const handleJoinError = (payload: { packId: string; message: string }) => {
      if (payload.packId !== packId) return;
      // Not surfaced in the returned state (hook's public shape is
      // intentionally kept to cells/connectionStatus/latestAlert) — logged
      // so a rejected join (e.g. access revoked mid-session) isn't just
      // silently stuck on skeleton cards with no trace.
      console.warn(
        `[usePackRealtime] join:pack rejected for ${payload.packId}: ${payload.message}`,
      );
    };

    // Backend now scopes cell:update/cell:alert to the `pack:${packId}`
    // room a client was authorized into (see socketService.js +
    // mqttService.js), so this filter is no longer the only thing standing
    // between this hook and another pack's data — but it's kept as
    // defense-in-depth (e.g. against a future regression that broadcasts
    // globally again) rather than relied on as the sole boundary.
    const handleCellUpdate = (event: CellUpdateEvent) => {
      if (event.pack_id !== packId) return;
      setCells((prev) => new Map(prev).set(event.cell_id, event));
    };

    const handleCellAlert = (event: CellUpdateEvent) => {
      if (event.pack_id !== packId) return;
      setLatestAlert(event);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('join:pack:error', handleJoinError);
    socket.on('cell:update', handleCellUpdate);
    socket.on('cell:alert', handleCellAlert);

    if (socket.connected) {
      joinPackRoom(packId);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('join:pack:error', handleJoinError);
      socket.off('cell:update', handleCellUpdate);
      socket.off('cell:alert', handleCellAlert);
      leavePackRoom(packId);
    };
  }, [packId]);

  return { cells, connectionStatus, latestAlert };
};
