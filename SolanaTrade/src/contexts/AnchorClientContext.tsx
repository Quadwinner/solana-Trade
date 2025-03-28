import { createContext, FC, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { useConnection, useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { AnchorClient } from '../services/anchor-client';
import toast from 'react-hot-toast';

interface AnchorClientContextState {
  client: AnchorClient | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  inFallbackMode: boolean;
  retryConnection: () => void;
}

const AnchorClientContext = createContext<AnchorClientContextState>({
  client: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  inFallbackMode: false,
  retryConnection: () => {},
});

export const useAnchorClient = () => {
  return useContext(AnchorClientContext);
};

interface AnchorClientProviderProps {
  children: ReactNode;
}

export const AnchorClientProvider: FC<AnchorClientProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { connected } = useWallet();
  
  const [client, setClient] = useState<AnchorClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);
  const [inFallbackMode, setInFallbackMode] = useState(false);

  // Retry initialization
  const retryConnection = useCallback(() => {
    console.log('Retrying client initialization');
    setInitAttempt(prev => prev + 1);
    setError(null);
  }, []);

  // Function to initialize the client with error handling
  const initializeClient = useCallback(async () => {
    if (!connected || !anchorWallet || !connection) {
      return;
    }

    console.log('Initializing Anchor client...');
    console.log('Connection endpoint:', connection.rpcEndpoint);
    console.log('Wallet public key:', anchorWallet.publicKey.toString());
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Creating new AnchorClient instance');
      // Create client
      const newClient = new AnchorClient(connection, anchorWallet);
      
      // Check if client is ready
      if (newClient.isReady()) {
        console.log('AnchorClient created successfully');
        setClient(newClient);
        setIsInitialized(true);
        setInFallbackMode(false);
        toast.success('Connected to Solana blockchain');
      } else {
        // If client isn't properly initialized, use fallback mode
        console.warn('Client initialized in fallback mode');
        setClient(newClient);
        setIsInitialized(true);
        setInFallbackMode(true);
        toast.success('Connected in fallback mode - limited functionality available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error initializing AnchorClient:', err);
      console.error('Error details:', errorMessage);
      setError(`Failed to initialize blockchain connection: ${errorMessage}`);
      toast.error(`Blockchain connection failed: ${errorMessage}`);
      
      // Try to enter fallback mode
      try {
        console.log('Attempting to create client in fallback mode');
        const fallbackClient = new AnchorClient(connection, anchorWallet);
        setClient(fallbackClient);
        setIsInitialized(true);
        setInFallbackMode(true);
        toast.success('Connected in fallback mode - limited functionality available');
      } catch (fallbackErr) {
        console.error('Failed to create fallback client:', fallbackErr);
        setIsInitialized(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [anchorWallet, connection, connected]);

  useEffect(() => {
    if (!connected) {
      console.log('Wallet not connected, clearing Anchor client');
      setClient(null);
      setIsInitialized(false);
      setError(null);
      setInFallbackMode(false);
      return;
    }
    
    if (!anchorWallet) {
      console.log('Anchor wallet not available');
      setError('Wallet not available');
      return;
    }
    
    if (!connection) {
      console.log('Connection not available');
      setError('Blockchain connection not available');
      return;
    }
    
    // Initialize the client
    initializeClient();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up Anchor client');
      setClient(null);
    };
  }, [anchorWallet, connection, connected, initAttempt, initializeClient]);

  return (
    <AnchorClientContext.Provider 
      value={{ 
        client, 
        isInitialized, 
        isLoading, 
        error,
        inFallbackMode,
        retryConnection
      }}
    >
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 p-4 rounded shadow z-50">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={retryConnection} 
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Retry Connection
          </button>
        </div>
      )}
      {inFallbackMode && !error && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 p-4 rounded shadow z-50">
          <p className="text-yellow-700">Running in limited functionality mode</p>
          <button 
            onClick={retryConnection} 
            className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Try Full Connection
          </button>
        </div>
      )}
      {children}
    </AnchorClientContext.Provider>
  );
}; 