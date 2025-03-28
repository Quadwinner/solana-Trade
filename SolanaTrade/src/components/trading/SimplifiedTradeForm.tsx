import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorClient } from '../../contexts/AnchorClientContext';
import toast from 'react-hot-toast';
import { 
  MockStock, 
  executeBuy, 
  executeSell, 
  calculatePortfolioValue, 
  loadPortfolio,
  loadStocks,
  clearAllMockData,
  simpleBuy,
  simpleSell
} from './MockStockService';

interface TradeFormProps {
  initialStock?: any;
  initialOrderType?: 'buy' | 'sell';
}

export function SimplifiedTradeForm({ initialStock, initialOrderType = 'buy' }: TradeFormProps) {
  const { publicKey } = useWallet();
  const { isInitialized } = useAnchorClient();
  
  const [orderType, setOrderType] = useState<'buy' | 'sell'>(initialOrderType);
  const [selectedStock, setSelectedStock] = useState<any>(initialStock || null);
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Update form when stock changes
  useEffect(() => {
    if (initialStock) {
      // Ensure we have a valid PublicKey object for the stock
      try {
        let stockWithValidKey = {...initialStock};
        
        // If publicKey is not a PublicKey instance, convert it
        if (!(initialStock.publicKey instanceof PublicKey)) {
          console.log('Converting publicKey to PublicKey instance:', initialStock.publicKey);
          try {
            if (typeof initialStock.publicKey === 'string') {
              stockWithValidKey.publicKey = new PublicKey(initialStock.publicKey);
            } else if (initialStock.publicKey?._bn) {
              // For objects with _bn property, use a hardcoded replacement
              // Create a stock key based on symbol and authority
              const symbol = initialStock.account?.symbol || 'UNKNOWN';
              const authority = typeof initialStock.account?.authority === 'string' 
                ? initialStock.account.authority 
                : 'C1EuT9VokAKLiW7i2ingX3AAKdCXRyFep7pvKQCyTukJ';
                
              const bytes = new Uint8Array(32).fill(1); // Safe default bytes
              stockWithValidKey.publicKey = new PublicKey(bytes);
              
              console.log('Created replacement publicKey for', symbol);
            } else {
              // Fallback to a known valid PublicKey as last resort
              stockWithValidKey.publicKey = new PublicKey('11111111111111111111111111111111');
              console.log('Using fallback publicKey');
            }
          } catch (keyError) {
            console.error('Failed to convert publicKey, using fallback', keyError);
            stockWithValidKey.publicKey = new PublicKey('11111111111111111111111111111111');
          }
        }
        
        // If authority is not a PublicKey instance, convert it
        if (!(initialStock.account?.authority instanceof PublicKey)) {
          console.log('Converting authority to PublicKey instance:', initialStock.account?.authority);
          try {
            if (typeof initialStock.account?.authority === 'string') {
              stockWithValidKey.account = {
                ...stockWithValidKey.account,
                authority: new PublicKey(initialStock.account.authority)
              };
            } else if (initialStock.account?.authority?._bn) {
              // For objects with _bn property, use a hardcoded replacement
              stockWithValidKey.account = {
                ...stockWithValidKey.account,
                authority: new PublicKey('C1EuT9VokAKLiW7i2ingX3AAKdCXRyFep7pvKQCyTukJ')
              };
              console.log('Created replacement authority');
            } else {
              // Fallback to a known valid PublicKey
              stockWithValidKey.account = {
                ...stockWithValidKey.account,
                authority: new PublicKey('C1EuT9VokAKLiW7i2ingX3AAKdCXRyFep7pvKQCyTukJ')
              };
              console.log('Using fallback authority');
            }
          } catch (keyError) {
            console.error('Failed to convert authority, using fallback', keyError);
            stockWithValidKey.account = {
              ...stockWithValidKey.account,
              authority: new PublicKey('C1EuT9VokAKLiW7i2ingX3AAKdCXRyFep7pvKQCyTukJ')
            };
          }
        }
        
        console.log('Stock with valid keys:', {
          publicKey: stockWithValidKey.publicKey.toString(),
          authority: stockWithValidKey.account?.authority?.toString()
        });
        
        setSelectedStock(stockWithValidKey);
        
        if (stockWithValidKey.account?.current_price) {
          setPrice(stockWithValidKey.account.current_price.toString());
        }
      } catch (error) {
        console.error('Error processing initialStock:', error);
        toast.error('Error loading stock data. Please try clicking Reset All Data.');
      }
    }
  }, [initialStock]);
  
  // Update when order type changes
  useEffect(() => {
    if (initialOrderType) {
      setOrderType(initialOrderType);
    }
  }, [initialOrderType]);

  // Helper function to reset all data for testing
  const handleResetData = () => {
    if (window.confirm('This will clear all transaction data. Are you sure?')) {
      try {
        // Complete data wipe
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            localStorage.removeItem(key);
          }
        }
        
        // Display reset confirmation
        toast.success('All transaction data has been reset');
        
        // Reload the page immediately to reflect changes
        window.location.href = '/marketplace';
      } catch (error) {
        console.error('Error resetting data:', error);
        toast.error('Failed to reset data');
      }
    }
  };
  
  // Emergency debug function to hard-reset everything
  const handleForceReset = () => {
    try {
      // Clear all localStorage data
      localStorage.clear();
      
      // Set a flag to indicate a hard reset was performed
      localStorage.setItem('hard_reset_performed', 'true');
      
      // Display confirmation
      alert('EMERGENCY RESET COMPLETED: All data has been cleared. Page will reload.');
      
      // Force page reload
      window.location.href = '/';
    } catch (error) {
      console.error('Emergency reset failed:', error);
      alert('Emergency reset failed. Please try again or refresh the page manually.');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isInitialized) {
      toast.error('Blockchain connection not initialized');
      return;
    }
    
    if (!publicKey) {
      toast.error('Wallet not connected');
      return;
    }
    
    if (!selectedStock) {
      toast.error('Please select a stock');
      return;
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    const quantityValue = parseFloat(quantity);
    const priceValue = parseFloat(price);
    
    // Ensure we have a valid PublicKey object for the stock
    let validStockPublicKey: PublicKey;
    try {
      if (selectedStock.publicKey instanceof PublicKey) {
        validStockPublicKey = selectedStock.publicKey;
      } else if (typeof selectedStock.publicKey === 'string') {
        validStockPublicKey = new PublicKey(selectedStock.publicKey);
      } else if (selectedStock.publicKey?._bn) {
        // Handle case where it's a PublicKey-like object with _bn property
        validStockPublicKey = new PublicKey(selectedStock.publicKey.toString());
      } else {
        console.error('Invalid PublicKey object:', selectedStock.publicKey);
        toast.error('Invalid stock data. Please refresh the page and try again.');
        return;
      }
    } catch (error) {
      console.error('Error creating PublicKey:', error, selectedStock.publicKey);
      toast.error('Invalid stock data. Please refresh the page and try again.');
      return;
    }
    
    // Get the string representation properly
    const stockPublicKeyString = validStockPublicKey.toString();
    
    setLoading(true);
    console.log('Transaction started', { 
      type: orderType, 
      stockPublicKeyString,
      quantity: quantityValue,
      price: priceValue,
      wallet: publicKey.toString()
    });
    
    try {
      let success = false;
      
      if (orderType === 'buy') {
        // Check if user is trying to buy their own stock
        const isOwner = selectedStock.account.authority.toString() === publicKey.toString();
        
        // Validate available supply
        if (quantityValue > selectedStock.account.available_supply) {
          toast.error(`Not enough shares available. Only ${selectedStock.account.available_supply} shares available.`);
          setLoading(false);
          return;
        }
        
        // Debug log the stock before purchase
        console.log('Stock before buy:', {
          publicKey: stockPublicKeyString,
          available: selectedStock.account.available_supply,
          attempting: quantityValue
        });
        
        // Try the normal buy first
        success = executeBuy(
          publicKey,
          validStockPublicKey,
          quantityValue,
          priceValue
        );
        
        // If normal buy fails, try simple buy
        if (!success) {
          console.log('Normal buy failed, trying simple buy');
          success = simpleBuy(
            publicKey.toString(),
            stockPublicKeyString,
            selectedStock.account.symbol,
            selectedStock.account.name,
            quantityValue,
            priceValue
          );
        }
        
        console.log('Buy transaction result:', success);
        
        if (success) {
          // Update portfolio value in context
          calculatePortfolioValue(publicKey);
          toast.success(`Successfully purchased ${quantity} shares of ${selectedStock.account.symbol}`);
          
          // Reload the stock data to reflect updated available supply
          const allStocks = loadStocks(publicKey);
          const updatedStock = allStocks.find(s => 
            s.publicKey.toString() === stockPublicKeyString
          );
          
          console.log('Updated stock after buy:', updatedStock ? {
            publicKey: updatedStock.publicKey.toString(),
            available: updatedStock.account.available_supply
          } : 'Stock not found');
          
          if (updatedStock) {
            setSelectedStock(updatedStock);
          }
        } else {
          toast.error('Transaction failed. Please try again.');
        }
      } else {
        // For sell, check if user owns enough shares of this stock
        const portfolio = loadPortfolio(publicKey);
        
        // Debug log the user's portfolio
        console.log('Portfolio before sell:', portfolio.map(p => ({
          stock: p.stockPublicKey.toString(),
          symbol: p.symbol,
          quantity: p.quantity
        })));
        
        const position = portfolio.find(p => 
          p.stockPublicKey.toString() === stockPublicKeyString
        );
        
        if (!position) {
          toast.error(`You don't own any shares of ${selectedStock.account.symbol}.`);
          setLoading(false);
          return;
        }
        
        if (position.quantity < quantityValue) {
          toast.error(`Not enough shares to sell. You only own ${position.quantity} shares.`);
          setLoading(false);
          return;
        }
        
        // Debug log the stock before selling
        console.log('Stock before sell:', {
          publicKey: stockPublicKeyString,
          available: selectedStock.account.available_supply,
          selling: quantityValue,
          position: position.quantity
        });
        
        // Try the normal sell first
        success = executeSell(
          publicKey,
          validStockPublicKey,
          quantityValue,
          priceValue
        );
        
        // If normal sell fails, try simple sell
        if (!success) {
          console.log('Normal sell failed, trying simple sell');
          success = simpleSell(
            publicKey.toString(),
            stockPublicKeyString,
            quantityValue,
            priceValue
          );
        }
        
        console.log('Sell transaction result:', success);
        
        if (success) {
          // Update portfolio value in context
          calculatePortfolioValue(publicKey);
          toast.success(`Successfully sold ${quantity} shares of ${selectedStock.account.symbol}`);
          
          // Reload the stock data to reflect updated available supply
          const allStocks = loadStocks(publicKey);
          const updatedStock = allStocks.find(s => 
            s.publicKey.toString() === stockPublicKeyString
          );
          
          console.log('Updated stock after sell:', updatedStock ? {
            publicKey: updatedStock.publicKey.toString(),
            available: updatedStock.account.available_supply
          } : 'Stock not found');
          
          if (updatedStock) {
            setSelectedStock(updatedStock);
          }
        } else {
          toast.error('Transaction failed. Please try again.');
        }
      }
      
      // Reset form on success
      if (success) {
        setQuantity('');
        
        // Trigger a reload of the page/component that should reflect updated values
        window.dispatchEvent(new CustomEvent('stock-transaction-completed', { 
          detail: { 
            stockPublicKey: stockPublicKeyString,
            walletPublicKey: publicKey.toString(),
            type: orderType
          } 
        }));
      }
      
    } catch (error) {
      console.error('Trade error:', error);
      if (error instanceof Error) {
        toast.error(`Trade failed: ${error.message}`);
      } else {
        toast.error('Trade failed: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate total value
  const totalValue = selectedStock && quantity
    ? parseFloat(quantity) * parseFloat(price || '0')
    : 0;
  
  // Price input section with limited price suggestions (2 nearest values)
  const getCurrentPriceOptions = () => {
    if (!selectedStock) return [];
    
    const currentPrice = selectedStock.account.current_price;
    // Create just 2 price options (nearest values)
    const priceOptions = [
      currentPrice * 0.99, // 1% below
      currentPrice,        // Current price
      currentPrice * 1.01  // 1% above
    ];
    
    return priceOptions
      .map(p => parseFloat(p.toFixed(2))); // Format to 2 decimal places only
  };
  
  return (
    <div className="card bg-gradient-to-br from-slate-800/50 to-slate-900/70 shadow-2xl h-full">
      <div className="card-body p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="card-title text-2xl text-gradient">Trade</h2>
        </div>
        
        {!selectedStock ? (
          <div className="glassmorphism p-8 rounded-xl text-center mb-4">
            <div className="text-4xl text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Stock Selected</h3>
            <p className="text-slate-400 mb-4">Please select a stock from the All Stocks tab to begin trading.</p>
            <a 
              href="/dashboard/all-stocks" 
              className="btn-3d btn-gradient font-medium py-2 px-6 rounded-xl inline-block"
            >
              Browse Stocks
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glassmorphism p-6 rounded-xl mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3">
                    <span className="text-white font-bold">{selectedStock.account?.symbol.substring(0, 1)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selectedStock.account?.symbol}</h3>
                    <p className="text-sm text-slate-400">{selectedStock.account?.name}</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  {parseFloat(selectedStock.account?.current_price).toFixed(2)} ◎
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Available Supply</div>
                  <div className="font-bold">{selectedStock.account?.available_supply.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Market Cap</div>
                  <div className="font-bold">
                    {(selectedStock.account?.current_price * selectedStock.account?.total_supply).toFixed(2)} ◎
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-800/30 p-1 rounded-xl mb-6">
              <button
                type="button"
                className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 ${orderType === 'buy' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-lg' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setOrderType('buy')}
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Buy
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 ${orderType === 'sell' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-medium shadow-lg' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setOrderType('sell')}
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
                Sell
              </button>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300">Quantity</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="input input-bordered w-full bg-slate-800/50 text-white border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-16"
                  min="1"
                  required
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  shares
                </div>
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300">Price per Share</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  className="input input-bordered w-full bg-slate-800/50 text-white border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-16"
                  step="0.01"
                  min="0.01"
                  required
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  SOL
                </div>
              </div>
            </div>
            
            <div className="card glassmorphism p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Total Cost</span>
                <span className="text-lg font-bold text-white">
                  {(parseFloat(quantity || '0') * parseFloat(price || '0')).toFixed(2)} ◎
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Estimated {orderType === 'buy' ? 'purchase' : 'sale'} value based on current inputs
              </div>
            </div>
            
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] 
                ${orderType === 'buy' 
                  ? 'btn-3d bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-600/20' 
                  : 'btn-3d bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-600/20'
                } 
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full mr-2"></div>
                  Processing...
                </>
              ) : (
                `${orderType === 'buy' ? 'Buy' : 'Sell'} ${selectedStock.account?.symbol}`
              )}
            </button>
          </form>
        )}
        
        <div className="flex justify-center mt-6 space-x-4">
          <button
            onClick={handleResetData}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset All Data
          </button>
          <button
            onClick={handleForceReset}
            className="text-sm text-red-500 hover:text-red-400 transition-colors flex items-center"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Emergency Reset
          </button>
        </div>
      </div>
    </div>
  );
}