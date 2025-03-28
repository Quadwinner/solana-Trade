// WebSocket shim for browser environments
import { EventEmitter } from 'eventemitter3';

// Create a proper WebSocket implementation that can be extended by rpc-websockets
class BrowserWebSocket extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number;
  url: string;
  protocol: string;
  private socket: WebSocket | null = null;

  constructor(address: string, protocols?: string | string[]) {
    super();
    this.readyState = BrowserWebSocket.CONNECTING;
    this.url = address;
    this.protocol = Array.isArray(protocols) ? protocols[0] : (protocols || '');
    
    try {
      // Create a native WebSocket
      this.socket = new window.WebSocket(address, protocols);
      
      this.socket.onopen = (event) => {
        this.readyState = BrowserWebSocket.OPEN;
        this.emit('open', event);
      };
      
      this.socket.onclose = (event) => {
        this.readyState = BrowserWebSocket.CLOSED;
        this.emit('close', event.code, event.reason);
      };
      
      this.socket.onerror = (event) => {
        this.emit('error', event);
      };
      
      this.socket.onmessage = (event) => {
        this.emit('message', event.data);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setTimeout(() => this.emit('error', error), 0);
    }
  }

  send(data: any): void {
    if (this.socket && this.readyState === BrowserWebSocket.OPEN) {
      try {
        if (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof ArrayBuffer)) {
          data = JSON.stringify(data);
        }
        this.socket.send(data);
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  close(code?: number, reason?: string): void {
    if (this.socket) {
      try {
        this.readyState = BrowserWebSocket.CLOSING;
        this.socket.close(code, reason);
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  // These methods are required by rpc-websockets but do nothing in the browser
  ping(): void {}
  pong(): void {}
  terminate(): void {
    this.close(1000, 'Terminated');
  }

  // Static accessor to the native WebSocket
  static get NativeWebSocket(): typeof WebSocket {
    return window.WebSocket;
  }
}

// Make sure we match the Node.js WebSocket API as closely as possible
BrowserWebSocket.prototype.CONNECTING = BrowserWebSocket.CONNECTING;
BrowserWebSocket.prototype.OPEN = BrowserWebSocket.OPEN;
BrowserWebSocket.prototype.CLOSING = BrowserWebSocket.CLOSING;
BrowserWebSocket.prototype.CLOSED = BrowserWebSocket.CLOSED;

// Export with both formats for different importing styles
export default BrowserWebSocket;
export { BrowserWebSocket as WebSocket }; 