// Setup environment first
import './setup-env';
// Import Solana Web3 fixes
import './shims/solana-web3-fix';
// Import RPC WebSocket fixes 
import './shims/index.browser.mjs';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/app.tsx'
import './index.css'
import { WalletConnectionProvider } from './components/trading/WalletConnectionProvider.tsx'
import { AnchorClientProvider } from './contexts/AnchorClientContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WalletConnectionProvider>
        <AnchorClientProvider>
          <AuthProvider>
            <App />
            <Toaster position="bottom-right" />
          </AuthProvider>
        </AnchorClientProvider>
      </WalletConnectionProvider>
    </BrowserRouter>
  </StrictMode>,
)
