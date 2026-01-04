import { io } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

console.log("🔌 Socket initializing with URL:", URL);

export const socket = io(URL, {
    autoConnect: true,
    transports: ["websocket"],
});
