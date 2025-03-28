// Complete replacement for rpc-websockets/dist/index.browser.mjs
// Import directly from the actual package
import EventEmitter from 'eventemitter3';

// This is what causes the error in rpc-websockets - instead of extending WebSocket
// we'll implement our own from scratch using the native browser WebSocket
class Client extends EventEmitter {
  constructor(address, options = {}) {
    super();
    this.address = address;
    this.options = options || {};
    this.socket = null;
    this.connected = false;
    this.autoconnect = options.autoconnect !== false;
    this.ready = false;
    this.queue = [];
    this.reconnect = options.reconnect !== false;
    this.reconnect_interval = options.reconnect_interval || 1000;
    this.reconnect_max_retries = options.reconnect_max_retries || 5;
    this.reconnect_attempts = 0;
    
    if (this.autoconnect) {
      this.connect();
    }
  }
  
  connect() {
    try {
      this.socket = new window.WebSocket(this.address, this.options.protocols || []);
      
      this.socket.onopen = () => {
        this.connected = true;
        this.ready = true;
        this.reconnect_attempts = 0;
        this.emit('open');
        
        // Process queue
        while (this.queue.length > 0) {
          const { method, params, id, resolve, reject, timeout } = this.queue.shift();
          this._call(method, params, id).then(resolve).catch(reject);
        }
      };
      
      this.socket.onclose = (event) => {
        this.connected = false;
        this.ready = false;
        this.emit('close', event.code, event.reason);
        
        if (this.reconnect && this.reconnect_attempts < this.reconnect_max_retries) {
          setTimeout(() => {
            this.reconnect_attempts++;
            this.connect();
          }, this.reconnect_interval);
        }
      };
      
      this.socket.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (error) {
          this.emit('error', new Error('Invalid JSON response'));
          return;
        }
        
        // Handle JSON-RPC responses
        if (data.id !== undefined) {
          this.emit(`rpc:${data.id}`, data);
        }
        
        // Handle pub/sub notifications
        if (data.method && data.params) {
          this.emit(data.method, data.params);
        }
        
        this.emit('message', data);
      };
      
      this.socket.onerror = (error) => {
        this.emit('error', error);
      };
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  call(method, params = []) {
    const id = Math.floor(Math.random() * 10000);
    
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        this.queue.push({ method, params, id, resolve, reject });
        return;
      }
      
      this._call(method, params, id).then(resolve).catch(reject);
    });
  }
  
  _call(method, params, id) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        method,
        params,
        id
      };
      
      const timeout = setTimeout(() => {
        this.removeAllListeners(`rpc:${id}`);
        reject(new Error('RPC request timeout'));
      }, this.options.timeout || 10000);
      
      this.once(`rpc:${id}`, (response) => {
        clearTimeout(timeout);
        
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      
      this.send(request);
    });
  }
  
  send(request) {
    if (!this.connected) {
      this.emit('error', new Error('WebSocket not connected'));
      return;
    }
    
    try {
      this.socket.send(JSON.stringify(request));
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  close(code, reason) {
    if (this.socket) {
      this.socket.close(code, reason);
    }
  }
  
  // For compatibility with existing code
  on(event, callback) {
    return super.on(event, callback);
  }
  
  subscribe(event) {
    return this.call('subscribe', [event]);
  }
  
  unsubscribe(event) {
    return this.call('unsubscribe', [event]);
  }
}

// Export the Client class in the same format as rpc-websockets
export { Client }; 