import { FC, ReactNode, useMemo } from 'react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Import wallet configuration
import { network, endpoint, connectionConfig } from './wallet-config';

// Import custom ConnectionProvider to avoid WebSocket issues
import { ConnectionProvider } from '@solana/wallet-adapter-react';

// Import the wallet adapter css
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletConnectionProviderProps {
  children: ReactNode;
}

export const WalletConnectionProvider: FC<WalletConnectionProviderProps> = ({ children }) => {
  // Initialize wallet adapters
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 