import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_BASE_URL;
console.log("🔌 Socket connecting to:", URL);

export const socket = io(URL, {
  autoConnect: false,
  // 1. Allow 'polling' as a backup if WebSocket is blocked by a firewall
  transports: ['websocket', 'polling'], 
  
  // 2. Mobile Optimization
  reconnection: true,
  reconnectionAttempts: 20, // Try longer to reconnect on spotty mobile data
  reconnectionDelay: 2000,
  
  // 3. Ensure cookies/headers are sent correctly (important for CORS)
  withCredentials: true,
  
  // 4. Matches the Nginx location /socket.io/
  path: "/socket.io/", 
});