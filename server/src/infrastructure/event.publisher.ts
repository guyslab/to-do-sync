import { Server as IOServer } from "socket.io";

class EventPublisher {
  private static io: IOServer;

  static attachHTTPServer(httpServer: import("http").Server) {
    EventPublisher.io = new IOServer(httpServer, { 
      cors: { 
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      // Explicitly allow connections from any origin
      allowEIO3: true,
    });
    
    EventPublisher.io.on("connection", (socket) => {
      console.log("Client connected to WebSocket:", socket.id);
      
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    });

    console.log("WebSocket server initialized and ready for connections");
  }

  static emit(channel: string, payload: any) {
    if (!EventPublisher.io) {
      console.error("Attempted to emit event but WebSocket server is not initialized");
      return;
    }
    console.log(`Emitting event on channel '${channel}':`, payload);
    EventPublisher.io.emit(channel, payload);
  }
}

export default EventPublisher;
