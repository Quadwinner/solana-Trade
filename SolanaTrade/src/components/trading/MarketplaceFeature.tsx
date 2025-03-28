import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorClient } from '../../contexts/AnchorClientContext';
import { StockCard } from './StockCard';
import { StockCreationForm } from './StockCreationForm';
import { useWallet } from '@solana/wallet-adapter-react';
import { loadStocks, MockStock } from './MockStockService';

export function MarketplaceFeature() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stocks, setStocks] = useState<MockStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isInitialized } = useAnchorClient();
  const { publicKey } = useWallet();
  
  // Function to refresh stocks
  const refreshStocks = () => {
    if (!publicKey) return;
    
    try {
      const loadedStocks = loadStocks(publicKey);
      setStocks(loadedStocks);
    } catch (error) {
      console.error('Error refreshing stocks:', error);
    }
  };
  
  // Load stocks when the component mounts
  useEffect(() => {
    if (publicKey) {
      setIsLoading(true);
      refreshStocks();
      setIsLoading(false);
    }
  }, [publicKey]);
  
  // Listen for stock transaction events
  useEffect(() => {
    const handleTransactionCompleted = () => {
      console.log('Transaction completed, refreshing stocks');
      refreshStocks();
    };
    
    window.addEventListener('stock-transaction-completed', handleTransactionCompleted);
    
    return () => {
      window.removeEventListener('stock-transaction-completed', handleTransactionCompleted);
    };
  }, [publicKey]);
  
  // Refresh stocks periodically
  useEffect(() => {
    if (!publicKey) return;
    
    const interval = setInterval(() => {
      refreshStocks();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [publicKey]);
  
  // Sort stocks by symbol
  const sortedStocks = stocks.sort((a, b) => {
    const symbolA = a.account.symbol || '';
    const symbolB = b.account.symbol || '';
    return symbolA.localeCompare(symbolB);
  });
  
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Marketplace</h1>
        {isInitialized && publicKey && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Hide Form' : 'Create New Stock'}
          </button>
        )}
      </div>
      
      {showCreateForm && (
        <div className="mb-8">
          <StockCreationForm />
        </div>
      )}
      
      {/* Market Stats */}
      <div className="stats shadow mb-8 w-full">
        <div className="stat">
          <div className="stat-title">Total Stocks</div>
          <div className="stat-value">{stocks.length || 0}</div>
          <div className="stat-desc">Available on the marketplace</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Market Status</div>
          <div className="stat-value text-success">Open</div>
          <div className="stat-desc">24/7 Trading</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Network</div>
          <div className="stat-value text-primary">Devnet</div>
          <div className="stat-desc">Solana Blockchain</div>
        </div>
      </div>
      
      {/* Stock Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : sortedStocks?.length ? (
          sortedStocks.map((stockAccount) => (
            <StockCard 
              key={stockAccount.publicKey.toString()} 
              stockAccount={stockAccount} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No Stocks Available</h2>
            <p className="mb-6">Be the first to create a stock on this marketplace!</p>
            {!showCreateForm && isInitialized && publicKey && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create Stock
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 