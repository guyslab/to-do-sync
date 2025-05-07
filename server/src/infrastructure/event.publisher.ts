import { Server as IOServer } from "socket.io";

class EventPublisher {
  private static io: IOServer;

  static attachHTTPServer(httpServer: import("http").Server) {
    EventPublisher.io = new IOServer(httpServer, { cors: { origin: "*" } });
  }

  static emit(channel: string, payload: any) {
    EventPublisher.io.emit(channel, payload);
  }
}

export default EventPublisher;
