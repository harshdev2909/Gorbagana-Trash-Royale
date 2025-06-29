// frontend/lib/game-ws.ts

type EventHandler = (data: any) => void;

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Record<string, EventHandler[]> = {};

  connect(url: string, onOpen?: () => void, onClose?: () => void) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (onOpen) onOpen();
    };

    this.ws.onclose = () => {
      if (onClose) onClose();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event && this.handlers[msg.event]) {
          this.handlers[msg.event].forEach(fn => fn(msg.data));
        }
      } catch (e) {
        // ignore
      }
    };
  }

  send(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, ...data }));
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  off(event: string, handler: EventHandler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(fn => fn !== handler);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

// Singleton instance (optional)
export const gameWS = new GameWebSocket(); 