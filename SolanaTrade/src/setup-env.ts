// Basic environment setup for Solana Web3.js
if (typeof window !== 'undefined') {
  // Make sure we have a global object
  if (!window.global) {
    (window as any).global = window;
  }
  
  // Add process for compatibility
  (window as any).process = (window as any).process || {
    env: { 
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
    browser: true,
    version: '',
    versions: {}
  };
  
  // Make sure Buffer is available
  if (!(window as any).Buffer) {
    (window as any).Buffer = (window as any).buffer?.Buffer;
  }
}

// Make sure WebSocket exists in the global scope
if (typeof window !== 'undefined' && typeof WebSocket !== 'undefined') {
  (window as any).WebSocket = WebSocket;
  (globalThis as any).WebSocket = WebSocket;
}

export {}; 