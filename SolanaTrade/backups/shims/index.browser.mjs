// Direct replacement for rpc-websockets/dist/index.browser.mjs that works in the browser
import { WebSocket } from './ws';
import { EventEmitter } from 'eventemitter3';

class Client extends EventEmitter {
  constructor(address, options = {}) {
    super();
    this.address = address;
    this.options = options;
    this.reconnect = options.reconnect !== false;
    this.reconnect_interval = options.reconnect_interval || 1000;
    this.max_reconnects = options.max_reconnects || 5;
    this.reconnect_count = 0;
    this.ready = false;
    
    if (!options.autoconnect) return;
    this.open();
  }

  open() {
    this.socket = new WebSocket(this.address, this.options.protocols || []);
    
    this.socket.on('open', () => {
      this.ready = true;
      this.reconnect_count = 0;
      this.emit('open');
    });
    
    this.socket.on('message', (data) => {
      let message;
      try {
        message = JSON.parse(data);
      } catch (error) {
        return;
      }
      
      // Handle different message types
      if (message.id !== undefined) {
        this.emit(`res:${message.id}`, message);
      }
      
      if (message.method) {
        this.emit(message.method, message.params);
      }
      
      this.emit('message', message);
    });
    
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
    
    this.socket.on('close', (code, reason) => {
      this.ready = false;
      this.emit('close', code, reason);
      
      if (this.reconnect && this.reconnect_count < this.max_reconnects) {
        setTimeout(() => {
          this.reconnect_count++;
          this.open();
        }, this.reconnect_interval);
      }
    });
  }
  
  close(code, reason) {
    if (!this.socket) return;
    this.socket.close(code, reason);
  }
  
  call(method, params) {
    return new Promise((resolve, reject) => {
      if (!this.ready) return reject(new Error('WebSocket not connected'));
      
      const id = Math.floor(Math.random() * 10000);
      this.socket.send(JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: params || [],
        id
      }));
      
      const timeout = setTimeout(() => {
        this.removeAllListeners(`res:${id}`);
        reject(new Error('Response timeout'));
      }, this.options.timeout || 10000);
      
      this.once(`res:${id}`, (response) => {
        clearTimeout(timeout);
        if (response.error) return reject(response.error);
        resolve(response.result);
      });
    });
  }
  
  notify(method, params) {
    if (!this.ready) return;
    this.socket.send(JSON.stringify({
      jsonrpc: '2.0',
      method,
      params: params || []
    }));
  }
}

export { Client }; 