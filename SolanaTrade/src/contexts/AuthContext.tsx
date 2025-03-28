import { createContext, FC, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';

// Define the shape of our authentication context
interface AuthContextState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAdminStatus: (publicKey: PublicKey) => boolean;
  username: string | null;
}

// Create the context with default values
const AuthContext = createContext<AuthContextState>({
  isAuthenticated: false,
  isAdmin: false,
  login: async () => false,
  logout: () => {},
  checkAdminStatus: () => false,
  username: null,
});

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

// Authentication storage key
const AUTH_STORAGE_KEY = 'solana_trade_auth';

// Define a list of admin wallet addresses (public keys)
// This would typically come from a database or server
const ADMIN_WALLETS = [
  // The following makes any wallet an admin for testing
  // Uncomment for testing and remove in production
  "ANY_WALLET_IS_ADMIN",
  
  // User specified admin wallet
  "CauHK3m4DRTe6yPrBTDYQrzSvjsi8xN6BhppkZLCuZv9",
  
  // Default admin wallet for testing - admin/password login
  "C1EuT9VokAKLiW7i2ingX3AAKdCXRyFep7pvKQCyTukJ"
];

// Provider component that wraps your app and provides the auth context value
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { publicKey } = useWallet();
  
  // Save auth state to localStorage
  const saveAuthState = useCallback((isAuth: boolean, isAdm: boolean, user: string | null) => {
    if (isAuth) {
      const authData = {
        isAuthenticated: isAuth,
        isAdmin: isAdm,
        username: user,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        console.log('Saved authentication state to localStorage:', authData);
      } catch (error) {
        console.error('Error saving auth state to localStorage:', error);
      }
    } else {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (error) {
        console.error('Error removing auth state from localStorage:', error);
      }
    }
  }, []);
  
  // Load authentication state from localStorage on mount
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          if (authData && typeof authData === 'object') {
            // Check for session expiration (24 hours)
            const isExpired = authData.timestamp && 
              (Date.now() - authData.timestamp > 24 * 60 * 60 * 1000);
            
            if (isExpired) {
              console.log('Auth session expired, clearing...');
              localStorage.removeItem(AUTH_STORAGE_KEY);
            } else {
              setIsAuthenticated(authData.isAuthenticated || false);
              setIsAdmin(authData.isAdmin || false);
              setUsername(authData.username || null);
              console.log('Loaded authentication state from localStorage:', authData);
            }
          }
        } catch (error) {
          console.error('Error parsing stored auth data:', error);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);
  
  // Check if the connected wallet has admin privileges
  useEffect(() => {
    if (!isInitialized) return;
    
    if (publicKey) {
      const adminStatus = checkAdminStatus(publicKey);
      
      // If a wallet is connected that's an admin, automatically log them in
      if (adminStatus) {
        const walletUsername = `Admin (${publicKey.toString().substring(0, 8)}...)`;
        
        setIsAdmin(true);
        if (!isAuthenticated) {
          setIsAuthenticated(true);
          setUsername(walletUsername);
          toast.success('Logged in as Admin via wallet');
          
          // Save auth state to localStorage
          saveAuthState(true, true, walletUsername);
        }
      }
    } else {
      // If wallet disconnects, check if we were authenticated via wallet
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          // Only log out if the username looks like a wallet-based username
          if (authData.username && authData.username.startsWith('Admin (') && authData.username.includes('...)')) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setUsername(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
            toast.info('Logged out - wallet disconnected');
          }
        } catch (error) {
          console.error('Error parsing auth data when wallet disconnected:', error);
        }
      }
    }
  }, [publicKey, isInitialized, isAuthenticated, saveAuthState]);
  
  // Check if a wallet address has admin privileges
  const checkAdminStatus = (walletPublicKey: PublicKey): boolean => {
    const walletStr = walletPublicKey.toString();
    console.log(`Checking admin status for wallet: ${walletStr}`);
    
    // For development purposes, consider any connected wallet as admin
    if (ADMIN_WALLETS.includes("ANY_WALLET_IS_ADMIN")) {
      console.log("Development mode: Any wallet is admin");
      return true;
    }
    
    // Check if the wallet address is in the admin list
    const isInAdminList = ADMIN_WALLETS.includes(walletStr);
    console.log(`Is in admin list: ${isInAdminList}`);
    
    return isInAdminList;
  };

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    if (!isInitialized) {
      console.error('Auth system not yet initialized');
      return false;
    }
    
    // Simple hardcoded authentication for demo purposes
    // In a real app, this would call an API endpoint
    console.log(`Login attempt: Username "${username}", Password length: ${password.length}`);
    
    // Make username comparison case-insensitive for better UX
    const normalizedUsername = username.toLowerCase().trim();
    
    if (normalizedUsername === 'admin' && password === 'password') {
      console.log('Admin login successful');
      setIsAuthenticated(true);
      setIsAdmin(true);
      setUsername('admin');
      toast.success('Logged in as Admin');
      
      // Save auth state to localStorage
      saveAuthState(true, true, 'admin');
      return true;
    }
    
    if (normalizedUsername === 'user' && password === 'password') {
      console.log('Regular user login successful');
      setIsAuthenticated(true);
      setIsAdmin(false);
      setUsername('user');
      toast.success('Logged in as Regular User');
      
      // Save auth state to localStorage
      saveAuthState(true, false, 'user');
      return true;
    }
    
    console.log(`Login failed for username: ${username}`);
    toast.error('Invalid username or password');
    return false;
  };

  // Logout function
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUsername(null);
    
    // Remove auth state from localStorage
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error during logout');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        login,
        logout,
        checkAdminStatus,
        username
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 