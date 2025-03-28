// Special fix for @solana/web3.js to work around WebSocket issues

// Make sure global properties needed by Solana Web3.js are set
if (typeof window !== 'undefined') {
  // Add environment checks
  (window as any).IS_BROWSER = true;
  (window as any).IS_NODE = false;

  // Make sure window.WebSocket is defined
  if (window.WebSocket) {
    (window as any).WebSocket = window.WebSocket;
  }
}

// Define a safe version of fetch
const safeSolanaFetch = async (url: string, options: any = {}) => {
  try {
    // Convert any object to JSON string
    if (options && options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
    
    // Make sure Content-Type is set for JSON
    if (options && options.body && typeof options.body === 'string') {
      options.headers = options.headers || {};
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    }
    
    return await fetch(url, options);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Only monkey patch if we're in a browser
if (typeof window !== 'undefined') {
  // Store original methods before patching
  const originalFetch = window.fetch;
  
  // We'll only add this if needed in the future
  // window.fetch = safeSolanaFetch;
}

export {}; 