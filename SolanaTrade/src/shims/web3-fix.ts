// This file provides fixes for Solana Web3.js WebSocket issues in browser environments

// Make sure WebSocket is properly defined in the global scope
if (typeof window !== 'undefined') {
  // Define WebSocket at window.WebSocket
  (window as any).WebSocket = window.WebSocket;
  
  // Also define it on the window.global object for libraries that check there
  if (!(window as any).global) {
    (window as any).global = window;
  }
  
  if (!(window as any).global.WebSocket) {
    (window as any).global.WebSocket = window.WebSocket;
  }
  
  // Define common node.js properties that libraries might expect
  (window as any).global.Buffer = (window as any).Buffer;
  (window as any).global.process = (window as any).process || {
    env: { NODE_ENV: process.env.NODE_ENV || 'development' },
    browser: true
  };
}

export {}; 