// Mock implementation for WalletConnect's JsonRpcWsConnection
import { EventEmitter } from 'eventemitter3';

class MockWsConnection extends EventEmitter {
  private url: string;
  
  constructor(url: string) {
    super();
    this.url = url;
    setTimeout(() => this.emit('connect'), 100);
  }
  
  open() {
    this.emit('connect');
    return Promise.resolve();
  }
  
  close() {
    this.emit('disconnect');
    return Promise.resolve();
  }
  
  send(payload: any) {
    // For most operations, just acknowledge receipt
    setTimeout(() => {
      this.emit('payload', { 
        id: payload.id,
        jsonrpc: '2.0', 
        result: true 
      });
    }, 50);
    return Promise.resolve();
  }
}

// Export the mock class
export { MockWsConnection as JsonRpcWebSocketConnection };
export default MockWsConnection; 