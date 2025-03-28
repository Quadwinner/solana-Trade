import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  MockStock, 
  loadStocks,
  executeBuy,
  executeSell,
  PortfolioPosition,
  loadPortfolio 
} from './MockStockService';

// Simulated tick data structure
interface TickData {
  price: number;
  timestamp: number;
  change: number;
  volume: number;
}

// Price history for chart
interface PriceHistory {
  [key: string]: TickData[];
}

const IntraDayTradingFeature = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const location = useLocation();
  
  // State management
  const [selectedStock, setSelectedStock] = useState<MockStock | null>(null);
  const [stocks, setStocks] = useState<MockStock[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({});
  const [quantity, setQuantity] = useState<string>('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  const [timeFrame, setTimeFrame] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [lastTickData, setLastTickData] = useState<TickData | null>(null);
  
  // Check for initialStock from navigation state
  useEffect(() => {
    if (location.state?.selectedStock) {
      const stockFromNav = location.state.selectedStock;
      console.log('Stock received from navigation:', stockFromNav);
      
      // Ensure we have a valid stock with PublicKey objects
      try {
        const validStock = {
          ...stockFromNav,
          publicKey: typeof stockFromNav.publicKey === 'string' 
            ? new PublicKey(stockFromNav.publicKey) 
            : stockFromNav.publicKey,
          account: {
            ...stockFromNav.account,
            authority: typeof stockFromNav.account?.authority === 'string'
              ? new PublicKey(stockFromNav.account.authority)
              : stockFromNav.account?.authority
          }
        };
        
        setSelectedStock(validStock);
        console.log('Set selected stock for intraday trading:', validStock);
      } catch (error) {
        console.error('Error processing selected stock from navigation:', error);
        toast.error('Error loading stock data. Please select a stock manually.');
      }
      
      // Clear navigation state to prevent persistence
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  // Load stocks and start simulation
  useEffect(() => {
    if (!publicKey) return;
    
    // Load available stocks
    try {
      console.log('Loading stocks for wallet:', publicKey.toString());
      const availableStocks = loadStocks(publicKey);
      console.log(`Loaded ${availableStocks.length} stocks`);
      setStocks(availableStocks);
      
      // Load user portfolio
      const userPortfolio = loadPortfolio(publicKey);
      setPortfolio(userPortfolio);
      
      // Initialize price history for all stocks
      const initialPriceHistory: PriceHistory = {};
      availableStocks.forEach(stock => {
        initialPriceHistory[stock.publicKey.toString()] = generateInitialPriceHistory(stock.account.current_price);
      });
      setPriceHistory(initialPriceHistory);
      
      // If there's no selected stock yet but we have stocks, select the first one
      if (!selectedStock && availableStocks.length > 0) {
        console.log('Setting initial stock:', availableStocks[0].account.symbol);
        setSelectedStock(availableStocks[0]);
        setLastTickData({
          price: availableStocks[0].account.current_price,
          timestamp: Date.now(),
          change: 0,
          volume: Math.floor(Math.random() * 1000) + 100
        });
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      toast.error('Failed to load stocks. Please try refreshing the page.');
    }
    
    // Start tick simulation
    const tickInterval = setInterval(() => {
      simulateMarketTick();
    }, 2000); // Tick every 2 seconds
    
    return () => {
      clearInterval(tickInterval);
    };
  }, [publicKey]);
  
  // Update chart when selected stock changes
  useEffect(() => {
    if (selectedStock && chartRef.current) {
      console.log('Drawing chart for', selectedStock.account.symbol);
      drawChart();
    }
  }, [selectedStock, priceHistory, timeFrame]);
  
  // Generate random initial price history (simulated historical data)
  const generateInitialPriceHistory = (basePrice: number): TickData[] => {
    const history: TickData[] = [];
    const now = Date.now();
    const hoursBack = 6; // 6 hours of data
    
    // Generate data points for the past 6 hours
    for (let i = hoursBack * 60; i >= 0; i--) {
      const randomChange = (Math.random() - 0.5) * 0.02; // -0.01 to 0.01 (±1%)
      const previousPrice = i === hoursBack * 60 ? basePrice : history[history.length - 1].price;
      const price = previousPrice * (1 + randomChange);
      const volume = Math.floor(Math.random() * 1000) + 100;
      
      history.push({
        price,
        timestamp: now - i * 60 * 1000, // i minutes ago
        change: randomChange * 100, // percentage
        volume
      });
    }
    
    return history;
  };
  
  // Simulate market tick with price changes
  const simulateMarketTick = () => {
    if (!publicKey || stocks.length === 0) return;
    
    // Update all stocks with new tick data
    const updatedStocks = [...stocks];
    const updatedPriceHistory = { ...priceHistory };
    
    updatedStocks.forEach(stock => {
      const stockKey = stock.publicKey.toString();
      const currentPrice = stock.account.current_price;
      
      // Generate random price movement (±2%)
      const priceChange = (Math.random() - 0.5) * 0.04 * currentPrice;
      const newPrice = Math.max(0.01, currentPrice + priceChange);
      const percentChange = (priceChange / currentPrice) * 100;
      const volume = Math.floor(Math.random() * 500) + 50;
      
      // Create new tick data
      const newTick: TickData = {
        price: newPrice,
        timestamp: Date.now(),
        change: percentChange,
        volume
      };
      
      // Update price history
      if (updatedPriceHistory[stockKey]) {
        updatedPriceHistory[stockKey] = [
          ...updatedPriceHistory[stockKey],
          newTick
        ];
      } else {
        updatedPriceHistory[stockKey] = [newTick];
      }
      
      // Update stock price
      stock.account.current_price = newPrice;
      
      // Update last tick data if this is the selected stock
      if (selectedStock && stock.publicKey.toString() === selectedStock.publicKey.toString()) {
        setLastTickData(newTick);
      }
    });
    
    // Update state
    setStocks(updatedStocks);
    setPriceHistory(updatedPriceHistory);
    
    // If we have a selected stock, update it
    if (selectedStock) {
      const updatedSelectedStock = updatedStocks.find(
        s => s.publicKey.toString() === selectedStock.publicKey.toString()
      );
      if (updatedSelectedStock) {
        setSelectedStock(updatedSelectedStock);
      }
    } else if (updatedStocks.length > 0) {
      // If we don't have a selected stock but stocks are available, select the first one
      setSelectedStock(updatedStocks[0]);
      
      // Create an initial tick for this stock
      const initialTick: TickData = {
        price: updatedStocks[0].account.current_price,
        timestamp: Date.now(),
        change: 0,
        volume: Math.floor(Math.random() * 500) + 50
      };
      
      setLastTickData(initialTick);
    }
    
    // Redraw chart if needed
    if (chartRef.current && selectedStock) {
      drawChart();
    }
  };
  
  // Draw price chart
  const drawChart = () => {
    if (!chartRef.current || !selectedStock) return;
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    const stockKey = selectedStock.publicKey.toString();
    const stockHistory = priceHistory[stockKey] || [];
    
    // Clear canvas
    ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
    
    // If no data, return
    if (stockHistory.length === 0) return;
    
    // Filter data based on selected time frame
    let filteredHistory = [...stockHistory];
    const now = Date.now();
    
    switch(timeFrame) {
      case '1m':
        filteredHistory = stockHistory.filter(tick => tick.timestamp >= now - 60 * 1000);
        break;
      case '5m':
        filteredHistory = stockHistory.filter(tick => tick.timestamp >= now - 5 * 60 * 1000);
        break;
      case '15m':
        filteredHistory = stockHistory.filter(tick => tick.timestamp >= now - 15 * 60 * 1000);
        break;
      case '1h':
        filteredHistory = stockHistory.filter(tick => tick.timestamp >= now - 60 * 60 * 1000);
        break;
    }
    
    // Need at least 2 points to draw a line
    if (filteredHistory.length < 2) return;
    
    // Find min and max prices for scaling
    const prices = filteredHistory.map(tick => tick.price);
    const minPrice = Math.min(...prices) * 0.995; // Add 0.5% padding
    const maxPrice = Math.max(...prices) * 1.005; // Add 0.5% padding
    const priceRange = maxPrice - minPrice;
    
    // Canvas dimensions
    const width = chartRef.current.width;
    const height = chartRef.current.height;
    
    // Start drawing
    ctx.beginPath();
    ctx.strokeStyle = filteredHistory[0].price <= filteredHistory[filteredHistory.length - 1].price 
      ? '#4ade80' // green for up trend
      : '#f87171'; // red for down trend
    ctx.lineWidth = 2;
    
    // Draw price line
    filteredHistory.forEach((tick, index) => {
      const x = (index / (filteredHistory.length - 1)) * width;
      const y = height - ((tick.price - minPrice) / priceRange) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Add price labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#a3a3a3';
    ctx.textAlign = 'left';
    ctx.fillText(`${minPrice.toFixed(2)}`, 5, height - 5);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxPrice.toFixed(2)}`, width - 5, 15);
  };
  
  // Handle stock selection
  const handleStockSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const stockKey = event.target.value;
    console.log('Stock selected with key:', stockKey);
    
    const stock = stocks.find(s => s.publicKey.toString() === stockKey);
    if (stock) {
      console.log('Setting selected stock to:', stock.account.symbol);
      setSelectedStock(stock);
      
      // Create an initial tick for this stock if we don't have lastTickData
      if (!lastTickData) {
        const initialTick: TickData = {
          price: stock.account.current_price,
          timestamp: Date.now(),
          change: 0,
          volume: Math.floor(Math.random() * 500) + 50
        };
        
        setLastTickData(initialTick);
      }
      
      // Force redraw of chart
      setTimeout(() => {
        if (chartRef.current) {
          drawChart();
        }
      }, 100);
    } else {
      console.error('Stock not found with key:', stockKey);
    }
  };
  
  // Handle time frame selection
  const handleTimeFrameSelect = (frame: '1m' | '5m' | '15m' | '1h') => {
    setTimeFrame(frame);
  };
  
  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!publicKey || !selectedStock) {
      toast.error('Please connect your wallet and select a stock');
      return;
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    const quantityValue = parseFloat(quantity);
    const currentPrice = selectedStock.account.current_price;
    
    setIsLoading(true);
    
    try {
      let success = false;
      
      if (orderType === 'buy') {
        success = executeBuy(
          publicKey,
          selectedStock.publicKey,
          quantityValue,
          currentPrice
        );
      } else {
        success = executeSell(
          publicKey,
          selectedStock.publicKey,
          quantityValue,
          currentPrice
        );
      }
      
      if (success) {
        toast.success(`${orderType === 'buy' ? 'Buy' : 'Sell'} order executed successfully`);
        
        // Refresh portfolio
        const updatedPortfolio = loadPortfolio(publicKey);
        setPortfolio(updatedPortfolio);
        
        // Refresh stocks
        const updatedStocks = loadStocks(publicKey);
        setStocks(updatedStocks);
        
        // Update selected stock
        const updatedSelectedStock = updatedStocks.find(
          s => s.publicKey.toString() === selectedStock.publicKey.toString()
        );
        if (updatedSelectedStock) {
          setSelectedStock(updatedSelectedStock);
        }
        
        // Clear quantity
        setQuantity('');
      } else {
        toast.error(`Failed to execute ${orderType} order`);
      }
    } catch (error) {
      console.error('Error executing order:', error);
      toast.error('Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle quick trade buttons
  const handleQuickTrade = (type: 'buy' | 'sell', percentage: number) => {
    if (!selectedStock || !publicKey) return;
    
    setOrderType(type);
    
    if (type === 'buy') {
      // Quick buy based on available supply
      const quickAmount = Math.floor(selectedStock.account.available_supply * (percentage / 100));
      setQuantity(quickAmount.toString());
    } else {
      // Quick sell based on portfolio holdings
      const position = portfolio.find(p => 
        p.stockPublicKey.toString() === selectedStock.publicKey.toString()
      );
      
      if (position) {
        const quickAmount = Math.floor(position.quantity * (percentage / 100));
        setQuantity(quickAmount.toString());
      } else {
        toast.error('You don\'t own any shares of this stock');
      }
    }
  };
  
  // Format price change with color and sign
  const formatPriceChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    const className = change >= 0 ? 'text-green-400' : 'text-red-400';
    
    return (
      <span className={className}>
        {sign}{change.toFixed(2)}%
      </span>
    );
  };
  
  // Force refresh stocks
  const handleRefreshStocks = () => {
    setIsLoading(true);
    try {
      if (!publicKey) {
        toast.error('Wallet not connected');
        return;
      }
      
      console.log('Forcing stock refresh for wallet:', publicKey.toString());
      const refreshedStocks = loadStocks(publicKey);
      console.log(`Refreshed ${refreshedStocks.length} stocks`);
      setStocks(refreshedStocks);
      
      // Initialize price history for all stocks
      const initialPriceHistory: PriceHistory = {};
      refreshedStocks.forEach(stock => {
        initialPriceHistory[stock.publicKey.toString()] = generateInitialPriceHistory(stock.account.current_price);
      });
      setPriceHistory(initialPriceHistory);
      
      // If no selected stock but we have stocks, select the first one
      if ((!selectedStock || !refreshedStocks.find(s => s.publicKey.toString() === selectedStock.publicKey.toString())) 
          && refreshedStocks.length > 0) {
        const firstStock = refreshedStocks[0];
        console.log('Setting selected stock to:', firstStock.account.symbol);
        setSelectedStock(firstStock);
        setLastTickData({
          price: firstStock.account.current_price,
          timestamp: Date.now(),
          change: 0,
          volume: Math.floor(Math.random() * 1000) + 100
        });
      }
      
      toast.success(`${refreshedStocks.length} stocks loaded`);
    } catch (error) {
      console.error('Error refreshing stocks:', error);
      toast.error('Failed to refresh stocks');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate user's position in the selected stock
  const getCurrentPosition = () => {
    if (!selectedStock || !publicKey) return null;
    
    return portfolio.find(p => 
      p.stockPublicKey.toString() === selectedStock.publicKey.toString()
    );
  };
  
  // Calculate potential profit/loss from the current position
  const calculatePotentialPnL = (position: PortfolioPosition) => {
    if (!selectedStock) return 0;
    
    const currentPrice = selectedStock.account.current_price;
    const entryPrice = position.averagePrice;
    const quantity = position.quantity;
    
    return ((currentPrice - entryPrice) / entryPrice) * 100;
  };
  
  // Check if user is connected
  if (!publicKey) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
        <div className="text-center p-8">
          <h3 className="text-xl font-bold text-white mb-4">Intraday Trading</h3>
          <p className="text-slate-400 mb-6">Please connect your wallet to access intraday trading features</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="p-4 sm:p-6">
        <h3 className="text-xl font-bold text-white mb-4">Intraday Trading</h3>
        
        {/* Stock selector and time frame controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="stockSelect" className="block text-sm font-medium text-slate-400 mb-2">
                Select Stock
              </label>
              <button
                onClick={handleRefreshStocks}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center mb-2"
                disabled={isLoading}
              >
                <svg className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Loading...' : 'Refresh Stocks'}
              </button>
            </div>
            <select
              id="stockSelect"
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedStock?.publicKey.toString() || ''}
              onChange={handleStockSelect}
            >
              {stocks.length === 0 ? (
                <option value="" disabled>No stocks available</option>
              ) : (
                stocks.map(stock => (
                  <option key={stock.publicKey.toString()} value={stock.publicKey.toString()}>
                    {stock.account.name} ({stock.account.symbol})
                  </option>
                ))
              )}
            </select>
            {stocks.length === 0 && (
              <p className="text-xs text-red-400 mt-1">
                No stocks found. Please try refreshing or create a stock first.
              </p>
            )}
          </div>
          
          {/* Time frame selector */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Time Frame
            </label>
            <div className="flex space-x-2">
              {(['1m', '5m', '15m', '1h'] as const).map(frame => (
                <button
                  key={frame}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                    timeFrame === frame
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  onClick={() => handleTimeFrameSelect(frame)}
                >
                  {frame}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Price chart and info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-slate-700 rounded-xl p-4 h-64">
            <canvas 
              ref={chartRef} 
              width={800} 
              height={400} 
              className="w-full h-full"
            />
          </div>
          
          {/* Stock information */}
          <div className="bg-slate-700 rounded-xl p-4 flex flex-col justify-between">
            {selectedStock && lastTickData ? (
              <>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {selectedStock.account.symbol}
                  </h4>
                  <p className="text-slate-400 text-sm mb-4">
                    {selectedStock.account.name}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="text-xs text-slate-400">Price</p>
                      <p className="text-xl font-bold text-white">
                        {selectedStock.account.current_price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Change</p>
                      <p className="text-lg font-semibold">
                        {formatPriceChange(lastTickData.change)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Volume</p>
                      <p className="text-sm text-white">
                        {lastTickData.volume.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Available</p>
                      <p className="text-sm text-white">
                        {selectedStock.account.available_supply.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Current position */}
                {getCurrentPosition() && (
                  <div className="border-t border-slate-600 pt-3 mt-3">
                    <p className="text-xs text-slate-400">Your Position</p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-white">
                        {getCurrentPosition()?.quantity.toLocaleString()} shares
                      </p>
                      <p className={`text-sm ${
                        calculatePotentialPnL(getCurrentPosition()!) >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {calculatePotentialPnL(getCurrentPosition()!).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Select a stock to view details</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick trade buttons */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-2">Quick Trade</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-slate-400 mb-1">Quick Buy</p>
              <div className="flex space-x-2">
                {[10, 25, 50, 100].map(percentage => (
                  <button
                    key={`buy-${percentage}`}
                    className="flex-1 bg-green-800/50 hover:bg-green-700/60 text-green-200 py-1 rounded-lg text-sm font-medium"
                    onClick={() => handleQuickTrade('buy', percentage)}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Quick Sell</p>
              <div className="flex space-x-2">
                {[10, 25, 50, 100].map(percentage => (
                  <button
                    key={`sell-${percentage}`}
                    className="flex-1 bg-red-800/50 hover:bg-red-700/60 text-red-200 py-1 rounded-lg text-sm font-medium"
                    onClick={() => handleQuickTrade('sell', percentage)}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Order form */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Order type */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Order Type
              </label>
              <div className="flex space-x-1 rounded-lg bg-slate-600 p-1">
                <button
                  type="button"
                  className={`w-full py-2 text-sm font-medium leading-5 rounded-lg ${
                    orderType === 'buy' 
                      ? 'bg-green-600 text-white shadow' 
                      : 'text-slate-300 hover:bg-slate-500'
                  }`}
                  onClick={() => setOrderType('buy')}
                >
                  Buy
                </button>
                <button
                  type="button" 
                  className={`w-full py-2 text-sm font-medium leading-5 rounded-lg ${
                    orderType === 'sell' 
                      ? 'bg-red-600 text-white shadow' 
                      : 'text-slate-300 hover:bg-slate-500'
                  }`}
                  onClick={() => setOrderType('sell')}
                >
                  Sell
                </button>
              </div>
            </div>
            
            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-400 mb-2">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="0"
                step="1"
                className="w-full bg-slate-600 text-white rounded-lg px-3 py-2 border border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            
            {/* Price (read-only) */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-slate-400 mb-2">
                Current Price
              </label>
              <input
                id="price"
                type="text"
                className="w-full bg-slate-600 text-white rounded-lg px-3 py-2 border border-slate-500 focus:outline-none"
                value={selectedStock?.account.current_price.toFixed(2) || ''}
                readOnly
              />
            </div>
            
            {/* Total Cost */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Total Cost
              </label>
              <div className="w-full bg-slate-600 text-white rounded-lg px-3 py-2 border border-slate-500">
                {(parseFloat(quantity || '0') * (selectedStock?.account.current_price || 0)).toFixed(2)}
              </div>
            </div>
            
            {/* Submit button */}
            <div>
              <button
                className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                  orderType === 'buy'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={handleSubmitOrder}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  `${orderType === 'buy' ? 'Buy' : 'Sell'} Now`
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Recent activity */}
        <div>
          <h4 className="text-white font-medium mb-2">Your Portfolio</h4>
          {portfolio.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Avg. Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Current Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">P/L</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {portfolio.map(position => {
                    const pnlPercentage = ((position.currentPrice - position.averagePrice) / position.averagePrice) * 100;
                    
                    return (
                      <tr key={position.stockPublicKey.toString()} className="hover:bg-slate-750">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {position.symbol}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                          {position.quantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                          {position.averagePrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                          {position.currentPrice.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                          pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {pnlPercentage.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded-md text-sm font-medium"
                            onClick={() => {
                              const stock = stocks.find(s => s.publicKey.toString() === position.stockPublicKey.toString());
                              if (stock) {
                                setSelectedStock(stock);
                                setOrderType('sell');
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
          ) : (
            <div className="bg-slate-700 rounded-xl p-4 text-center">
              <p className="text-slate-400">You don't have any positions yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntraDayTradingFeature;
