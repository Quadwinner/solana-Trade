import { useState, useEffect } from 'react'
import { useAnchorClient } from '../../contexts/AnchorClientContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import * as anchor from '@coral-xyz/anchor'
import { loadStocks, executeBuy, executeSell, MockStock } from './MockStockService'

interface Stock {
  id: string
  name: string
  symbol: string
  price: number
  available: number
  publicKey?: PublicKey
}

interface TradeFormProps {
  initialStock?: Stock | null;
  initialOrderType?: 'buy' | 'sell';
}

export const TradeForm = ({ initialStock, initialOrderType }: TradeFormProps) => {
  const { client, isInitialized, inFallbackMode } = useAnchorClient()
  const { connected, publicKey } = useWallet()
  
  // Add debug logging for initialStock
  useEffect(() => {
    console.log('TradeForm - initialStock received:', initialStock);
    console.log('TradeForm - initialOrderType received:', initialOrderType);
    console.log('TradeForm - client initialized:', isInitialized);
    console.log('TradeForm - inFallbackMode:', inFallbackMode);
    
    if (initialStock) {
      // Ensure PublicKey is handled correctly
      if (typeof initialStock.publicKey === 'string') {
        try {
          console.log('Converting string publicKey to PublicKey object');
          initialStock.publicKey = new PublicKey(initialStock.publicKey);
        } catch (error) {
          console.error('Error converting publicKey string to PublicKey object:', error);
        }
      }
    }
  }, [initialStock, initialOrderType, isInitialized, inFallbackMode]);
  
  const [stocks, setStocks] = useState<Stock[]>([
    {
      id: '1',
      name: 'Solana Labs',
      symbol: 'SLB',
      price: 234.56,
      available: 15000
    },
    {
      id: '2',
      name: 'Anchor Protocol',
      symbol: 'ANC',
      price: 78.12,
      available: 25000
    },
    {
      id: '3',
      name: 'Serum Exchange',
      symbol: 'SRM',
      price: 123.45,
      available: 18000
    },
    {
      id: '4',
      name: 'Pyth Network',
      symbol: 'PYT',
      price: 45.67,
      available: 30000
    },
    {
      id: '5',
      name: 'Marinade Finance',
      symbol: 'MRD',
      price: 89.32,
      available: 22000
    }
  ])

  const [orderType, setOrderType] = useState<'buy' | 'sell'>(initialOrderType || 'buy')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(initialStock || null)
  const [quantity, setQuantity] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [orderTypeForm, setOrderTypeForm] = useState<'market' | 'limit'>('market')
  const [walletBalance, setWalletBalance] = useState(2500.75)
  const [loading, setLoading] = useState(false)
  
  // Calculate total cost
  const totalCost = selectedStock && quantity
    ? parseFloat(quantity) * (orderTypeForm === 'market' ? selectedStock.price : parseFloat(price || '0'))
    : 0

  // Update price when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      setPrice(selectedStock.price.toFixed(2))
    } else {
      setPrice('')
    }
  }, [selectedStock])

  // Fetch stocks based on mode (blockchain or mock)
  useEffect(() => {
    const fetchStocks = async () => {
      if (publicKey) {
        try {
          // If client is initialized and not in fallback mode, use blockchain data
          if (client && isInitialized && !inFallbackMode) {
            console.log('Fetching stocks from blockchain');
            try {
              const stockAccounts = await client.getAllStocks();
              
              if (stockAccounts.length > 0) {
                const fetchedStocks = stockAccounts.map((stockAccount, index) => ({
                  id: stockAccount.publicKey.toString(),
                  name: stockAccount.account.name,
                  symbol: stockAccount.account.symbol,
                  price: stockAccount.account.currentPrice.toNumber() / 1e9, // Convert from lamports to SOL
                  available: stockAccount.account.availableSupply.toNumber(),
                  publicKey: stockAccount.publicKey
                }));
                
                setStocks(fetchedStocks);
                console.log('Fetched blockchain stocks:', fetchedStocks);
              }
            } catch (error) {
              console.error('Error fetching blockchain stocks:', error);
              // Fall back to mock data on error
              loadMockStocks();
            }
          } else {
            // Use mock data if in fallback mode or client not initialized
            loadMockStocks();
          }
        } catch (error) {
          console.error('Error loading stocks:', error);
        }
      }
    };
    
    // Helper function to load mock stocks
    const loadMockStocks = () => {
      console.log('Loading mock stocks');
      try {
        const mockStocks = loadStocks(publicKey);
        
        const formattedStocks = mockStocks.map((stock) => ({
          id: stock.publicKey.toString(),
          name: stock.account.name,
          symbol: stock.account.symbol,
          price: stock.account.current_price,
          available: stock.account.available_supply,
          publicKey: stock.publicKey
        }));
        
        setStocks(formattedStocks);
        console.log('Loaded mock stocks:', formattedStocks);
      } catch (error) {
        console.error('Error loading mock stocks:', error);
      }
    };
    
    fetchStocks();
  }, [client, isInitialized, inFallbackMode, publicKey]);

  // Check for stored trade state in sessionStorage on component mount
  useEffect(() => {
    // Check if we have session storage data for trade state
    const storedTradeState = sessionStorage.getItem('tradeState');
    if (storedTradeState) {
      try {
        const parsedState = JSON.parse(storedTradeState);
        console.log('Found stored trade state:', parsedState);
        
        // Use stored data if initialStock is not provided directly
        if (!initialStock && parsedState.stock) {
          console.log('Using stored stock data:', parsedState.stock);
          setSelectedStock(parsedState.stock);
        }
        
        // Use stored order type if not provided directly
        if (!initialOrderType && parsedState.orderType) {
          console.log('Using stored order type:', parsedState.orderType);
          setOrderType(parsedState.orderType);
        }
        
        // Clear the sessionStorage after use
        sessionStorage.removeItem('tradeState');
      } catch (error) {
        console.error('Error parsing stored trade state:', error);
      }
    }
  }, [initialStock, initialOrderType]);

  // Update when props change
  useEffect(() => {
    if (initialStock) {
      console.log('Setting selectedStock from initialStock:', initialStock);
      
      // Create a proper copy to avoid mutation of props
      const stockWithPublicKey = { ...initialStock };
      
      // Ensure publicKey is a PublicKey object for internal use
      if (stockWithPublicKey.publicKey) {
        try {
          // If it's a string, convert it to a PublicKey object
          if (typeof stockWithPublicKey.publicKey === 'string') {
            console.log(`Converting string publicKey to PublicKey object: ${stockWithPublicKey.publicKey}`);
            stockWithPublicKey.publicKey = new PublicKey(stockWithPublicKey.publicKey);
          } 
          // If it's already a PublicKey, make sure it's a valid one
          else if (!(stockWithPublicKey.publicKey instanceof PublicKey)) {
            console.log('publicKey is not a string or PublicKey, creating new one from id');
            stockWithPublicKey.publicKey = new PublicKey(stockWithPublicKey.id);
          }
          
          console.log('Final publicKey after conversion:', stockWithPublicKey.publicKey.toString());
        } catch (error) {
          console.error('Error converting publicKey:', error);
          
          // If conversion fails, try using the ID as a fallback
          if (stockWithPublicKey.id) {
            try {
              console.log('Using ID as fallback for publicKey:', stockWithPublicKey.id);
              stockWithPublicKey.publicKey = new PublicKey(stockWithPublicKey.id);
              
              // Set the stock after successful conversion
              setSelectedStock(stockWithPublicKey);
              return; // Exit early after successful fallback
            } catch (fallbackError) {
              console.error('Fallback publicKey creation also failed:', fallbackError);
              toast.error('Could not process stock data. Please try selecting the stock again.');
            }
          } else {
            toast.error('Invalid stock data. Missing valid identifier.');
          }
        }
      } else if (stockWithPublicKey.id) {
        // If no publicKey but we have an ID, try to use that
        try {
          console.log('No publicKey found, using ID as publicKey:', stockWithPublicKey.id);
          stockWithPublicKey.publicKey = new PublicKey(stockWithPublicKey.id);
          
          // Set the stock after successful conversion
          setSelectedStock(stockWithPublicKey);
          return; // Exit early after successful conversion
        } catch (error) {
          console.error('Error creating publicKey from ID:', error);
          toast.error('Could not create a valid identifier from the stock ID.');
        }
      } else {
        console.error('No publicKey or ID available for the stock');
        toast.error('Invalid stock data. Missing publicKey and ID.');
        return; // Exit early to avoid setting invalid data
      }
      
      // Only reach here if no errors occurred during conversion
      setSelectedStock(stockWithPublicKey);
    }
    
    if (initialOrderType) {
      console.log('Setting orderType from initialOrderType:', initialOrderType);
      setOrderType(initialOrderType);
    }
  }, [initialStock, initialOrderType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!selectedStock || !quantity) {
      toast.error("Please select a stock and enter a quantity");
      return;
    }
    
    const parsedQuantity = parseFloat(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Please enter a valid quantity greater than zero");
      return;
    }
    
    setLoading(true);
    
    try {
      // Make a copy of the selected stock to avoid mutating the state
      const stockForTrading = { ...selectedStock };
      
      // Ensure we have a valid PublicKey for the stock
      if (!stockForTrading.publicKey) {
        // If no publicKey, try to create from ID
        if (stockForTrading.id) {
          try {
            console.log('Creating publicKey from ID:', stockForTrading.id);
            stockForTrading.publicKey = new PublicKey(stockForTrading.id);
          } catch (error) {
            console.error('Error creating publicKey from ID:', error);
            toast.error("Could not process stock data. Invalid identifier.");
            setLoading(false);
            return;
          }
        } else {
          toast.error("Stock public key not found and no ID available");
          setLoading(false);
          return;
        }
      } else if (typeof stockForTrading.publicKey === 'string') {
        // If publicKey is a string, convert it to a PublicKey object
        try {
          console.log('Converting string publicKey to PublicKey object:', stockForTrading.publicKey);
          stockForTrading.publicKey = new PublicKey(stockForTrading.publicKey);
        } catch (error) {
          console.error('Error converting publicKey string:', error);
          
          // Try ID as fallback
          if (stockForTrading.id) {
            try {
              console.log('Fallback to ID:', stockForTrading.id);
              stockForTrading.publicKey = new PublicKey(stockForTrading.id);
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError);
              toast.error("Invalid stock identifier. Please select another stock.");
              setLoading(false);
              return;
            }
          } else {
            toast.error("Invalid stock public key format");
            setLoading(false);
            return;
          }
        }
      }
      
      // Validate that we have a proper PublicKey object
      if (!(stockForTrading.publicKey instanceof PublicKey)) {
        console.error('publicKey is not a PublicKey instance:', stockForTrading.publicKey);
        toast.error("Invalid stock data. Please select another stock.");
        setLoading(false);
        return;
      }
      
      console.log('Trading with stock publicKey:', stockForTrading.publicKey.toString());
      
      let success = false;
      const priceToUse = orderTypeForm === 'market' ? stockForTrading.price : parseFloat(price);
      
      // Try blockchain transaction if client is ready and not in fallback mode
      if (client && isInitialized && !inFallbackMode) {
        console.log('Attempting blockchain transaction');
        try {
          if (orderType === 'buy') {
            // Find a sell offer to accept
            const offers = await client.getActiveOffers();
            
            // Filter for sell offers for the selected stock
            const matchingOffers = offers.filter(
              offer => 
                !offer.account.isBuy && 
                offer.account.stock.equals(stockForTrading.publicKey!) &&
                offer.account.price.toNumber() <= priceToUse * 1e9 // Convert price to lamports
            );
            
            if (matchingOffers.length === 0) {
              toast.error("No matching sell offers found");
              setLoading(false);
              return;
            }
            
            // Sort by best price (lowest first)
            matchingOffers.sort((a, b) => 
              a.account.price.toNumber() - b.account.price.toNumber()
            );
            
            const bestOffer = matchingOffers[0];
            
            const tx = await client.acceptBuyOffer(
              bestOffer.publicKey,
              stockForTrading.publicKey!,
              bestOffer.account.maker
            );
            
            toast.success("Transaction successful!");
            console.log("Transaction signature:", tx);
            success = true;
          } else {
            // Create a sell offer
            const tx = await client.createOffer(
              stockForTrading.publicKey,
              parsedQuantity,
              priceToUse * 1e9 // Convert price to lamports
            );
            
            toast.success("Sell offer created successfully!");
            console.log("Transaction signature:", tx);
            success = true;
          }
        } catch (error) {
          console.error('Blockchain transaction error:', error);
          toast.error(`Blockchain transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Will fall back to mock trading
        }
      }
      
      // Use mock trading if blockchain transaction failed or we're in fallback mode
      if (!success) {
        console.log('Using mock trading');
        if (orderType === 'buy') {
          // Execute buy using the MockStockService
          success = executeBuy(
            publicKey,
            stockForTrading.publicKey,
            parsedQuantity,
            priceToUse
          );
          
          if (success) {
            toast.success(`Successfully bought ${parsedQuantity} ${stockForTrading.symbol} shares`);
            
            // Update wallet balance
            setWalletBalance(prev => prev - (parsedQuantity * priceToUse));
            
            // Dispatch custom event to notify other components
            const event = new CustomEvent('stock-transaction-completed', {
              detail: {
                type: 'buy',
                stockPublicKey: stockForTrading.publicKey.toString(),
                quantity: parsedQuantity,
                price: priceToUse,
                walletPublicKey: publicKey.toString()
              }
            });
            window.dispatchEvent(event);
          } else {
            toast.error(`Failed to buy ${stockForTrading.symbol}. Not enough available supply.`);
          }
        } else {
          // Execute sell using the MockStockService
          success = executeSell(
            publicKey,
            stockForTrading.publicKey,
            parsedQuantity,
            priceToUse
          );
          
          if (success) {
            toast.success(`Successfully sold ${parsedQuantity} ${stockForTrading.symbol} shares`);
            
            // Update wallet balance
            setWalletBalance(prev => prev + (parsedQuantity * priceToUse));
            
            // Dispatch custom event to notify other components
            const event = new CustomEvent('stock-transaction-completed', {
              detail: {
                type: 'sell',
                stockPublicKey: stockForTrading.publicKey.toString(),
                quantity: parsedQuantity,
                price: priceToUse,
                walletPublicKey: publicKey.toString()
              }
            });
            window.dispatchEvent(event);
          } else {
            toast.error(`Failed to sell ${stockForTrading.symbol}. Not enough shares in your portfolio.`);
          }
        }
      }
      
      // Reset form if successful
      if (success) {
        setQuantity('');
        if (orderTypeForm === 'limit') {
          setPrice(stockForTrading.price.toFixed(2));
        }
        
        // Reload stocks to get updated data
        if (inFallbackMode || !client || !isInitialized) {
          // Use mock stock service in fallback mode
          const updatedMockStocks = loadStocks(publicKey);
          const formattedStocks = updatedMockStocks.map((stock) => ({
            id: stock.publicKey.toString(),
            name: stock.account.name,
            symbol: stock.account.symbol,
            price: stock.account.current_price,
            available: stock.account.available_supply,
            publicKey: stock.publicKey
          }));
          setStocks(formattedStocks);
        } else {
          // Reload blockchain stocks
          try {
            const stockAccounts = await client.getAllStocks();
            const fetchedStocks = stockAccounts.map((stockAccount) => ({
              id: stockAccount.publicKey.toString(),
              name: stockAccount.account.name,
              symbol: stockAccount.account.symbol,
              price: stockAccount.account.currentPrice.toNumber() / 1e9,
              available: stockAccount.account.availableSupply.toNumber(),
              publicKey: stockAccount.publicKey
            }));
            setStocks(fetchedStocks);
          } catch (error) {
            console.error('Error reloading blockchain stocks:', error);
          }
        }
      }
      
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-white mb-6">Trade Stocks</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="col-span-1 lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Type Tabs */}
              <div className="flex space-x-1 rounded-xl bg-slate-700 p-1 mb-6 w-full sm:w-48">
                <button
                  type="button"
                  className={`w-full py-2 text-sm font-medium leading-5 rounded-lg ${
                    orderType === 'buy' 
                      ? 'bg-green-600 text-white shadow' 
                      : 'text-slate-400 hover:bg-slate-600'
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
                      : 'text-slate-400 hover:bg-slate-600'
                  }`}
                  onClick={() => setOrderType('sell')}
                >
                  Sell
                </button>
              </div>
              
              {!connected && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-900 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        Please connect your wallet to trade stocks.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stock Selection */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-slate-300">
                  Select Stock
                </label>
                <select
                  id="stock"
                  name="stock"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-slate-700 text-white"
                  value={selectedStock?.id || ''}
                  onChange={(e) => {
                    const stock = stocks.find(s => s.id === e.target.value)
                    setSelectedStock(stock || null)
                  }}
                  disabled={!connected || loading}
                >
                  <option value="">Select a stock</option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.symbol} - {stock.name} ({stock.price.toFixed(2)} SOL)
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Order Type (Market/Limit) */}
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Order Type
                </label>
                <div className="mt-1 space-y-2">
                  <div className="flex items-center">
                    <input
                      id="market"
                      name="orderTypeForm"
                      type="radio"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-600 bg-slate-700"
                      checked={orderTypeForm === 'market'}
                      onChange={() => setOrderTypeForm('market')}
                      disabled={!connected || loading}
                    />
                    <label htmlFor="market" className="ml-3 block text-sm font-medium text-slate-300">
                      Market Order
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="limit"
                      name="orderTypeForm"
                      type="radio"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-600 bg-slate-700"
                      checked={orderTypeForm === 'limit'}
                      onChange={() => setOrderTypeForm('limit')}
                      disabled={!connected || loading}
                    />
                    <label htmlFor="limit" className="ml-3 block text-sm font-medium text-slate-300">
                      Limit Order
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">
                  Quantity
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    name="quantity"
                    id="quantity"
                    className="bg-slate-700 border border-slate-600 text-white block w-full pl-3 pr-12 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={!connected || loading}
                  />
                </div>
              </div>
              
              {/* Price (for limit orders) */}
              {orderTypeForm === 'limit' && (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-slate-300">
                    Price (SOL)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="price"
                      id="price"
                      className="bg-slate-700 border border-slate-600 text-white block w-full pl-3 pr-12 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={!connected || loading}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">SOL</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Total Cost */}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    Total {orderType === 'buy' ? 'Cost' : 'Proceeds'}:
                  </span>
                  <span className="text-lg font-semibold text-white">
                    {totalCost.toFixed(4)} SOL
                  </span>
                </div>
                {orderType === 'buy' && (
                  <div className="flex justify-between mt-2">
                    <span className="text-sm font-medium text-slate-300">
                      Wallet Balance:
                    </span>
                    <span className={`text-sm font-medium ${walletBalance >= totalCost ? 'text-green-400' : 'text-red-400'}`}>
                      {walletBalance.toFixed(2)} SOL {walletBalance < totalCost && '(Insufficient)'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={!connected || !selectedStock || !quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0 || (orderType === 'buy' && totalCost > walletBalance) || loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    orderType === 'buy'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {orderType === 'buy' ? 'Buy' : 'Sell'} {selectedStock?.symbol || 'Stock'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Order Book */}
          <div className="col-span-1">
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-md font-medium text-white mb-4">Order Book</h4>
              
              {selectedStock ? (
                <div>
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-slate-300 mb-2">Sell Orders</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400">{(selectedStock.price * 1.01).toFixed(2)}</span>
                        <span className="text-slate-300">25.0</span>
                        <span className="text-slate-400">{(selectedStock.price * 1.01 * 25).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400">{(selectedStock.price * 1.005).toFixed(2)}</span>
                        <span className="text-slate-300">10.2</span>
                        <span className="text-slate-400">{(selectedStock.price * 1.005 * 10.2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400">{(selectedStock.price * 1.002).toFixed(2)}</span>
                        <span className="text-slate-300">5.8</span>
                        <span className="text-slate-400">{(selectedStock.price * 1.002 * 5.8).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center py-2 border-t border-b border-slate-600 mb-4">
                    <span className="text-xl font-bold text-white">{selectedStock.price.toFixed(2)}</span>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-slate-300 mb-2">Buy Orders</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">{(selectedStock.price * 0.998).toFixed(2)}</span>
                        <span className="text-slate-300">8.5</span>
                        <span className="text-slate-400">{(selectedStock.price * 0.998 * 8.5).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">{(selectedStock.price * 0.995).toFixed(2)}</span>
                        <span className="text-slate-300">15.0</span>
                        <span className="text-slate-400">{(selectedStock.price * 0.995 * 15).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">{(selectedStock.price * 0.99).toFixed(2)}</span>
                        <span className="text-slate-300">20.3</span>
                        <span className="text-slate-400">{(selectedStock.price * 0.99 * 20.3).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <h5 className="text-sm font-medium text-slate-300 mb-2">Market Info</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-400">24h High</div>
                      <div className="text-white text-right">{(selectedStock.price * 1.03).toFixed(2)}</div>
                      <div className="text-slate-400">24h Low</div>
                      <div className="text-white text-right">{(selectedStock.price * 0.97).toFixed(2)}</div>
                      <div className="text-slate-400">24h Volume</div>
                      <div className="text-white text-right">{(selectedStock.price * selectedStock.available * 0.1).toLocaleString(undefined, {maximumFractionDigits: 0})} SOL</div>
                      <div className="text-slate-400">Available</div>
                      <div className="text-white text-right">{selectedStock.available.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>Select a stock to view order book</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 