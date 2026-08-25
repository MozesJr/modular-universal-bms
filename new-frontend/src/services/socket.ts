import { Socket, io } from 'socket.io-client';
import { AUTH_TOKEN_KEY } from './api';

// Socket.IO is attached to the SAME http server as Express (see
// backend/src/server.js — `initSocket(server)` shares the listener with the
// REST API), so it's the API host minus the `/api` suffix — not a separate
// port/path.
//
// When VITE_API_URL isn't set at build time (production — see
// new-frontend/Dockerfile), this resolves to `undefined` rather than `''`:
// socket.io-client only defaults to same-origin (routing through the nginx
// proxy) when the uri argument is `null`/`undefined`; an empty string is
// treated as a real (broken) uri instead.
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : undefined;

let socket: Socket | null = null;

// backend/src/services/socketService.js validates this via `io.use(...)`
// on every (re)connection — an empty/expired token gets the connection
// rejected outright (`connect_error`), not just silently under-authorized.
// Read the token via a callback (not a plain object) so each reconnect
// attempt picks up whatever's currently in localStorage, not whatever was
// there the first time this module ran.
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: (cb) => cb({ token: localStorage.getItem(AUTH_TOKEN_KEY) }),
    });
  }
  return socket;
};

// Backend authorizes this server-side (owner/collaborator/admin check on
// the pack's parent Bms — see middleware/auth.js#resolvePackAccess) before
// actually joining the socket to `pack:${packId}`. A rejection comes back
// as a "join:pack:error" event rather than silently failing.
export const joinPackRoom = (packId: string): void => {
  getSocket().emit('join:pack', packId);
};

// Still a no-op server-side — socketService.js has no `leave:pack`
// listener, so the socket never actually leaves the room (it's cleaned up
// automatically on disconnect instead). Kept so callers don't have to care,
// and harmless to call in case that's added later.
export const leavePackRoom = (packId: string): void => {
  getSocket().emit('leave:pack', packId);
};
