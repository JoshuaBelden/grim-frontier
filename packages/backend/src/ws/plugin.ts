import type { FastifyInstance } from "fastify";
import websocketPlugin from "@fastify/websocket";

export async function registerWebSocket(app: FastifyInstance): Promise<void> {
  await app.register(websocketPlugin);

  app.get("/ws", { websocket: true }, (socket, _req) => {
    console.log("WebSocket client connected");
    socket.send(JSON.stringify({ type: "connected", message: "Welcome to Grim Frontier" }));

    socket.on("message", (data) => {
      console.log("WS message:", data.toString());
    });

    socket.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
}
