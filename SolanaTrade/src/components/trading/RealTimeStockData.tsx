import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { loadStocks, MockStock, saveStocks } from './MockStockService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Define the format expected by TradeForm
interface StockForTrading {
  id: string;
  name: string;
  symbol: string;
  price: number;
  available: number;
  publicKey?: PublicKey;
}

export function RealTimeStockData() {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [stocks, setStocks] = useState<MockStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<MockStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'marketCap'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [priceChanges, setPriceChanges] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  // Calculate total market cap
  const totalMarketCap = stocks.reduce((total, stock) => {
    return total + (stock.account.current_price * stock.account.total_supply);
  }, 0);

  // Handle refresh click
  const handleRefresh = () => {
    setLoading(true);
    try {
      const loadedStocks = loadStocks(publicKey);
      setStocks(loadedStocks);
      setLastUpdated(new Date());
      toast.success("Stock data refreshed");
    } catch (error) {
      console.error('Error refreshing stocks:', error);
      toast.error("Failed to refresh stock data");
    } finally {
      setLoading(false);
    }
  };

  // Handle sort by different columns
  const handleSort = (column: 'name' | 'price' | 'marketCap') => {
    // Toggle order if clicking the same column
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
  };

  // Filter and sort stocks when dependencies change
  useEffect(() => {
    if (!stocks) return;
    
    let filtered = [...stocks];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(stock => 
        stock.account.symbol.toLowerCase().includes(term) || 
        stock.account.name.toLowerCase().includes(term)
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.account.name.localeCompare(b.account.name);
      } else if (sortBy === 'price') {
        comparison = a.account.current_price - b.account.current_price;
      } else if (sortBy === 'marketCap') {
        const marketCapA = a.account.current_price * a.account.total_supply;
        const marketCapB = b.account.current_price * b.account.total_supply;
        comparison = marketCapA - marketCapB;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredStocks(filtered);
  }, [stocks, searchTerm, sortBy, sortOrder]);

  // Load stocks when the component mounts
  useEffect(() => {
    if (!publicKey) return;
    
    const loadAllStocks = () => {
      setIsLoading(true);
      try {
        const loadedStocks = loadStocks(publicKey);
        
        // Sort stocks by market cap (total_supply * current_price)
        const sortedStocks = [...loadedStocks].sort((a, b) => {
          const marketCapA = a.account.total_supply * a.account.current_price;
          const marketCapB = b.account.total_supply * b.account.current_price;
          return marketCapB - marketCapA; // Descending order
        });
        
        // Track price changes
        const newPriceChanges: Record<string, number> = {};
        
        sortedStocks.forEach(stock => {
          const stockKey = stock.publicKey.toString();
          const oldStock = stocks.find(s => s.publicKey.toString() === stockKey);
          
          if (oldStock) {
            const oldPrice = oldStock.account.current_price;
            const newPrice = stock.account.current_price;
            const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
            newPriceChanges[stockKey] = percentChange;
          } else {
            newPriceChanges[stockKey] = 0;
          }
        });
        
        setPriceChanges(newPriceChanges);
        setStocks(sortedStocks);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error loading stocks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial load
    loadAllStocks();
    
    // Set up interval for real-time updates (every 10 seconds)
    const interval = setInterval(() => {
      loadAllStocks();
    }, 10000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [publicKey, stocks.length]);

  // Simulate price fluctuations (would be replaced by real API in production)
  useEffect(() => {
    if (!publicKey || stocks.length === 0) return;
    
    const updatePrices = () => {
      const updatedStocks = stocks.map(stock => {
        // Create a copy of the stock object
        const updatedStock = { ...stock };
        
        // Random price change between -2% and +2%
        const changePercent = (Math.random() * 4) - 2; // -2 to +2
        const priceChange = stock.account.current_price * (changePercent / 100);
        updatedStock.account = {
          ...stock.account,
          current_price: Math.max(0.01, stock.account.current_price + priceChange)
        };
        
        return updatedStock;
      });
      
      // Save the updated stock prices
      saveStocks(updatedStocks);
      
      setStocks(updatedStocks);
      setLastUpdated(new Date());
    };
    
    // Update prices every 5 seconds
    const priceInterval = setInterval(updatePrices, 5000);
    
    return () => clearInterval(priceInterval);
  }, [publicKey, stocks]);

  // Helper function to convert MockStock to StockForTrading format
  const convertToTradingStock = (mockStock: MockStock): StockForTrading => {
    // Ensure we're sending the exact PublicKey object, not just a string
    return {
      id: mockStock.publicKey.toString(),
      name: mockStock.account.name,
      symbol: mockStock.account.symbol,
      price: mockStock.account.current_price,
      available: mockStock.account.available_supply,
      publicKey: mockStock.publicKey
    };
  };

  // Navigate to the trade tab with the selected stock
  const handleTradeClick = (stock: MockStock, orderType: 'buy' | 'sell') => {
    try {
      console.log("Navigating to trade with stock:", stock.publicKey.toString());
      
      // Use the stock directly without trying to convert it to a different format
      navigate('/dashboard', { 
        state: { 
          activeTab: 'trade',
          selectedStock: stock,
          orderType: orderType
        }
      });
    } catch (error) {
      console.error("Error navigating to trade:", error);
      toast.error("Error opening trade form. Please try again.");
    }
  };

  // Navigate to the intraday tab with the selected stock
  const handleIntradayClick = (stock: MockStock) => {
    try {
      console.log("Navigating to intraday with stock:", stock.publicKey.toString());
      
      navigate('/dashboard', { 
        state: { 
          activeTab: 'intraday',
          selectedStock: stock
        }
      });
    } catch (error) {
      console.error("Error navigating to intraday:", error);
      toast.error("Error opening intraday trading. Please try again.");
    }
  };

  if (!publicKey) {
    return (
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Please connect your wallet to view real-time stock data.</span>
      </div>
    );
  }

  if (isLoading && stocks.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="card glass-card p-6 shadow-2xl h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-4 shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white text-gradient">All Stocks</h2>
            <p className="text-slate-400">View and trade available stocks in real-time</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="glassmorphism rounded-xl px-4 py-3 flex items-center">
            <div className="mr-3">
              <div className="text-xs text-slate-400">Total Market Cap</div>
              <div className="text-lg font-bold text-white">{totalMarketCap.toFixed(2)} ◎</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12a8 8 0 01-8 8m0 0a8 8 0 01-8-8m8 8v3m0 0h8m-8 0H6m6-12V3m0 0h8m-8 0H6" />
              </svg>
            </div>
          </div>
          
          <button 
            onClick={handleRefresh} 
            className="btn-3d btn-secondary rounded-xl px-4 flex items-center"
            disabled={loading}
          >
            <svg className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="relative overflow-x-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="w-72">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search by symbol or name..."
                className="w-full pl-10 pr-4 py-2 glassmorphism rounded-xl bg-slate-800/30 text-white border-none focus:ring-2 focus:ring-indigo-500/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${sortBy === 'name' ? 'glassmorphism bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
              onClick={() => handleSort('name')}
            >
              Name {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${sortBy === 'price' ? 'glassmorphism bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
              onClick={() => handleSort('price')}
            >
              Price {sortBy === 'price' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${sortBy === 'marketCap' ? 'glassmorphism bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
              onClick={() => handleSort('marketCap')}
            >
              Market Cap {sortBy === 'marketCap' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse-slow flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-slate-400">Loading stock data...</p>
            </div>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="glassmorphism rounded-xl p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No Stocks Found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm 
                ? `No stocks match your search "${searchTerm}"`
                : "There are no stocks available to trade at the moment"
              }
            </p>
            <button 
              onClick={() => setSearchTerm('')} 
              className="btn-gradient px-4 py-2 rounded-lg inline-block"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="glassmorphism rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 text-slate-300">
                <tr>
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Market Cap</th>
                  <th className="px-6 py-4">Available Supply</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredStocks.map((stock, index) => {
                  const isOwner = wallet.publicKey && stock.account.authority.toString() === wallet.publicKey.toString();
                  const marketCap = stock.account.current_price * stock.account.total_supply;
                  
                  return (
                    <tr key={index} className="transition-colors hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
                            <span className="text-white font-bold text-sm">{stock.account.symbol.substring(0, 1)}</span>
                          </div>
                          <div className="font-semibold text-white">{stock.account.symbol}</div>
                          {isOwner && (
                            <div className="ml-2 px-2 py-0.5 text-xs bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-300 rounded-md">
                              Owner
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{stock.account.name}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                          {stock.account.current_price.toFixed(2)} ◎
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{marketCap.toFixed(2)} ◎</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-slate-300 mr-2">{stock.account.available_supply.toLocaleString()}</span>
                          <div className="w-16 bg-slate-700/50 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 rounded-full"
                              style={{ width: `${(stock.account.available_supply / stock.account.total_supply) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            className="text-xs bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded"
                            onClick={() => handleTradeClick(stock, 'buy')}
                          >
                            Buy
                          </button>
                          <button
                            className="text-xs bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded"
                            onClick={() => handleTradeClick(stock, 'sell')}
                          >
                            Sell
                          </button>
                          <button
                            className="text-xs bg-purple-700 hover:bg-purple-800 text-white px-2 py-1 rounded"
                            onClick={() => handleIntradayClick(stock)}
                          >
                            Intraday
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <div className="glassmorphism rounded-xl p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center text-sm text-slate-400">
              <svg className="w-4 h-4 mr-1 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Click "Buy" to purchase shares
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <svg className="w-4 h-4 mr-1 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
              Click "Sell" to sell your shares
            </div>
            <div className="flex items-center text-sm text-slate-400 ml-auto">
              <svg className="w-4 h-4 mr-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Total Stocks: {filteredStocks.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 