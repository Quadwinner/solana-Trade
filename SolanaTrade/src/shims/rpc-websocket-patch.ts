// This is a patch for rpc-websockets to ensure compatibility with browser environments
// It will be loaded by the setup-env.ts file

if (typeof window !== 'undefined') {
  // Ensure the native browser WebSocket is available globally
  if (!window.WebSocket) {
    console.error('WebSocket not available in this browser');
  }
  
  // Force WebSocket to be a global that RPC-WebSockets can find
  (window as any).global = window;
  (window as any).global.WebSocket = window.WebSocket;
}

export {}; 