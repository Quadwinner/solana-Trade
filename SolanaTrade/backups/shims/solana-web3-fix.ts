// Special fix for @solana/web3.js to work around WebSocket issues

// Make sure these properties are defined for compatibility
if (typeof globalThis !== 'undefined') {
  // Some libraries check for browser vs node environment
  (globalThis as any).IS_BROWSER = typeof window !== 'undefined';
  (globalThis as any).IS_NODE = typeof window === 'undefined';
  
  // Mark this as a known browser
  (globalThis as any).navigator = {
    ...(globalThis as any).navigator,
    userAgent: (globalThis as any).navigator?.userAgent || 'Mozilla/5.0 (compatible; SolanaWeb3.js)'
  };
  
  // Make sure WebSocket is defined globally
  if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
    (globalThis as any).WebSocket = window.WebSocket;
  }
}

// Patch for RPC provider
const originalFetch = fetch;
(window as any).fetch = async function patchedFetch(url: string, options: any = {}) {
  // Convert any base64 RPC request to text to avoid encoding issues
  if (options && options.body && typeof options.body === 'string' && url.includes('solana')) {
    try {
      const body = JSON.parse(options.body);
      // If this is a known Solana RPC method that might have issues
      if (body.method && ['getProgramAccounts', 'getAccountInfo'].includes(body.method)) {
        options.headers = options.headers || {};
        options.headers['Content-Type'] = 'application/json';
      }
    } catch (e) {
      // Not JSON, leave it as is
    }
  }
  return originalFetch(url, options);
};

export {}; 