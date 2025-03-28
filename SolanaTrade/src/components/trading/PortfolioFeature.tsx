import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorClient } from '../../contexts/AnchorClientContext';
import { StockCard } from './StockCard';
import { WalletButton } from '../solana/solana-provider';
import { loadStocks, MockStock, loadPortfolio, PortfolioPosition, calculatePortfolioValue } from './MockStockService';

export function PortfolioFeature() {
  const { publicKey } = useWallet();
  const { isInitialized } = useAnchorClient();
  const [ownedStocks, setOwnedStocks] = useState<MockStock[]>([]);
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadPortfolioData = () => {
    if (!publicKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading portfolio data for wallet:', publicKey.toString());
      
      // Load all stocks
      const allStocks = loadStocks(publicKey);
      console.log('Loaded stocks count:', allStocks.length);
      
      // Filter stocks where the current user is the authority
      const userStocks = allStocks.filter(
        (stock) => stock.account.authority.toString() === publicKey.toString()
      );
      
      console.log('User created stocks count:', userStocks.length);
      setOwnedStocks(userStocks);
      
      // Load portfolio positions
      const positions = loadPortfolio(publicKey);
      
      // Here's the fix - ensuring we get ALL positions from the portfolio
      if (positions && positions.length > 0) {
        console.log('User portfolio positions:', positions.length);
        console.log('First position quantity:', positions[0].quantity);
        console.log('All positions:', positions.map(p => ({
          symbol: p.symbol,
          quantity: p.quantity
        })));
      }
      
      setPortfolioPositions(positions);
      
      // Calculate total portfolio value
      const portfolioValue = calculatePortfolioValue(publicKey);
      console.log('Total portfolio value:', portfolioValue);
      setTotalValue(portfolioValue);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load portfolio data on mount and when publicKey changes
  useEffect(() => {
    loadPortfolioData();
  }, [publicKey]);
  
  // Listen for stock transaction events
  useEffect(() => {
    const handleTransactionCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Transaction event received:', customEvent.detail);
      
      // Only reload if transaction is for current wallet
      if (publicKey && customEvent.detail?.walletPublicKey === publicKey.toString()) {
        // Refresh portfolio data
        console.log('Refreshing portfolio data after transaction');
        loadPortfolioData();
      }
    };
    
    window.addEventListener('stock-transaction-completed', handleTransactionCompleted);
    
    return () => {
      window.removeEventListener('stock-transaction-completed', handleTransactionCompleted);
    };
  }, [publicKey]);
  
  // Wrapper function for loadPortfolioData that includes the publicKey dependency
  const refreshPortfolio = () => {
    if (publicKey) {
      console.log('Manual portfolio refresh triggered');
      loadPortfolioData();
    }
  };

  // Refresh portfolio every 10 seconds
  useEffect(() => {
    if (!publicKey) return;
    
    const interval = setInterval(() => {
      refreshPortfolio();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-8">Portfolio</h1>
        <div className="card max-w-md mx-auto bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title mb-4">Connect Your Wallet</h2>
            <p className="mb-6">Connect your wallet to view your portfolio.</p>
            <div className="card-actions">
              <WalletButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 min-h-[50vh]">
      <h1 className="text-3xl font-bold text-white mb-8">My Portfolio</h1>
      
      {/* Portfolio Stats */}
      <div className="stats shadow mb-8 w-full bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 text-white">
        <div className="stat">
          <div className="stat-title text-slate-400">Total Assets</div>
          <div className="stat-value text-blue-400">{ownedStocks.length + portfolioPositions.length}</div>
          <div className="stat-desc text-slate-500">Stocks in your portfolio</div>
        </div>
        
        <div className="stat">
          <div className="stat-title text-slate-400">Portfolio Value</div>
          <div className="stat-value text-green-400">{totalValue.toFixed(4)} ◎</div>
          <div className="stat-desc text-slate-500">Total market value</div>
        </div>
        
        <div className="stat">
          <div className="stat-title text-slate-400">Wallet</div>
          <div className="stat-value text-xs text-indigo-400">{publicKey.toString().substring(0, 8)}...</div>
          <div className="stat-desc text-slate-500">Your connected wallet</div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-blue-500"></span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Created Stocks */}
          {ownedStocks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Your Created Stocks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedStocks.map((stockAccount) => (
                  <StockCard 
                    key={stockAccount.publicKey.toString()} 
                    stockAccount={stockAccount} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Portfolio Positions */}
          {portfolioPositions.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Your Stock Positions</h2>
              <div className="overflow-x-auto">
                <table className="table w-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl text-white">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="text-slate-400">Stock</th>
                      <th className="text-slate-400 text-right">Quantity</th>
                      <th className="text-slate-400 text-right">Avg. Buy Price</th>
                      <th className="text-slate-400 text-right">Current Price</th>
                      <th className="text-slate-400 text-right">Value</th>
                      <th className="text-slate-400 text-right">P/L</th>
                      <th className="text-slate-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioPositions.map((position) => {
                      const value = position.quantity * position.currentPrice;
                      const costBasis = position.quantity * position.averagePrice;
                      const profitLoss = value - costBasis;
                      const profitLossPercentage = (profitLoss / costBasis) * 100;
                      
                      return (
                        <tr key={position.stockPublicKey.toString()} className="hover:bg-slate-800/50">
                          <td>
                            <div className="flex items-center space-x-3">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                  <span className="text-white font-bold">{position.symbol.substring(0, 1)}</span>
                                </div>
                              </div>
                              <div>
                                <div className="font-bold">{position.symbol}</div>
                                <div className="text-sm text-slate-400">{position.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right font-medium">{position.quantity.toLocaleString()}</td>
                          <td className="text-right">{position.averagePrice.toFixed(4)} ◎</td>
                          <td className="text-right">{position.currentPrice.toFixed(4)} ◎</td>
                          <td className="text-right font-bold">{value.toFixed(4)} ◎</td>
                          <td className={`text-right font-medium ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profitLoss.toFixed(4)} ◎
                            <div className="text-xs">({profitLossPercentage.toFixed(2)}%)</div>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 text-white"
                              onClick={() => {
                                try {
                                  const stockData = loadStocks(publicKey).find(s => 
                                    s.publicKey.toString() === position.stockPublicKey.toString()
                                  );
                                  
                                  if (stockData) {
                                    console.log("Trading stock:", {
                                      symbol: stockData.account.symbol,
                                      publicKey: stockData.publicKey.toString()
                                    });
                                    
                                    // First set the state in session storage before navigation
                                    sessionStorage.setItem('tradeState', JSON.stringify({
                                      activeTab: 'trade',
                                      selectedStock: {
                                        publicKey: stockData.publicKey.toString(),
                                        account: {
                                          ...stockData.account,
                                          authority: stockData.account.authority.toString()
                                        }
                                      }
                                    }));
                                    
                                    // Navigate to dashboard with proper URL parameters
                                    window.location.href = '/dashboard?tab=trade';
                                  } else {
                                    console.error("Stock not found:", position.stockPublicKey.toString());
                                    alert("Stock data not found. Please try again.");
                                  }
                                } catch (error) {
                                  console.error("Error navigating to trade view:", error);
                                  alert("Error loading stock data. Please try the Emergency Reset button on the trade page.");
                                }
                              }}
                            >
                              Trade
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {ownedStocks.length === 0 && portfolioPositions.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/30 p-6">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-4 text-white">No Stocks in Portfolio</h2>
              <p className="mb-6 text-slate-400">You don't own any stocks yet. Visit the marketplace to create or buy stocks.</p>
              <button 
                className="btn bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 text-white shadow-lg shadow-indigo-600/20"
                onClick={() => window.location.href = '/marketplace'}
              >
                Go to Marketplace
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 