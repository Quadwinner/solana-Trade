import { PublicKey } from '@solana/web3.js';

// Mock stock data type
export interface MockStock {
  publicKey: PublicKey;
  account: {
    name: string;
    symbol: string;
    total_supply: number;
    available_supply: number;
    current_price: number;
    authority: PublicKey;
  }
}

// Portfolio position type
export interface PortfolioPosition {
  stockPublicKey: PublicKey;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

// Store mock data in localStorage
const STORAGE_KEY = 'solana_trade_mock_stocks';
const PORTFOLIO_KEY = 'solana_trade_portfolio';

// Get global key for all stocks, regardless of wallet
export function getGlobalStocksKey(): string {
  return STORAGE_KEY;
}

// Helper to generate a deterministic PublicKey for a stock symbol
export function getStockPublicKey(symbol: string, authority: PublicKey): PublicKey {
  // Use a fixed seed for deterministic generation
  const seed = `${symbol}-${authority.toString()}`;
  
  // Create a simple array that's always 32 bytes long
  const bytes = new Uint8Array(32);
  
  // Fill the array with data from the seed string
  for (let i = 0; i < seed.length && i < 32; i++) {
    bytes[i] = seed.charCodeAt(i % seed.length);
  }
  
  // Ensure the bytes are valid for public key (first byte not 0)
  if (bytes[0] === 0) bytes[0] = 1;
  
  try {
    return new PublicKey(bytes);
  } catch (error) {
    console.error('Error creating PublicKey:', error);
    // Fallback to a default valid public key if needed
    return new PublicKey('11111111111111111111111111111111');
  }
}

// Save mock stocks to localStorage
export function saveStocks(stocks: MockStock[]): void {
  try {
    const stockData = stocks.map(stock => ({
      publicKey: stock.publicKey.toString(),
      account: {
        ...stock.account,
        authority: stock.account.authority.toString()
      }
    }));
    localStorage.setItem(getGlobalStocksKey(), JSON.stringify(stockData));
  } catch (error) {
    console.error('Error saving stocks:', error);
  }
}

// Load mock stocks from localStorage - now using a global key
export function loadStocks(currentAuthority: PublicKey): MockStock[] {
  try {
    // First check if we need to force reset
    const needsReset = localStorage.getItem('force_reset_stocks');
    
    if (!needsReset) {
      // First time load, set flag and force initial stocks
      localStorage.setItem('force_reset_stocks', 'true');
      const initialStocks = getInitialStocks(currentAuthority);
      saveStocks(initialStocks);
      console.log('First time load, forcing initial stocks');
      return initialStocks;
    }
    
    const stocksJson = localStorage.getItem(getGlobalStocksKey());
    if (!stocksJson) {
      const initialStocks = getInitialStocks(currentAuthority);
      saveStocks(initialStocks);
      return initialStocks;
    }
    
    const stocksData = JSON.parse(stocksJson);
    try {
      const stocks = stocksData.map((stock: any) => ({
        publicKey: new PublicKey(stock.publicKey),
        account: {
          ...stock.account,
          authority: new PublicKey(stock.account.authority)
        }
      }));
      
      if (stocks.length === 0) {
        console.log('No stocks found, loading initial stocks');
        const initialStocks = getInitialStocks(currentAuthority);
        saveStocks(initialStocks);
        return initialStocks;
      }
      
      return stocks;
    } catch (error) {
      console.error('Error parsing stocks data:', error);
      const initialStocks = getInitialStocks(currentAuthority);
      saveStocks(initialStocks);
      return initialStocks;
    }
  } catch (error) {
    console.error('Error loading stocks:', error);
    const initialStocks = getInitialStocks(currentAuthority);
    saveStocks(initialStocks);
    return initialStocks;
  }
}

// Create a new stock
export function createMockStock(
  name: string,
  symbol: string,
  totalSupply: number,
  currentPrice: number,
  authority: PublicKey
): MockStock {
  const stockPubkey = getStockPublicKey(symbol, authority);
  
  const newStock: MockStock = {
    publicKey: stockPubkey,
    account: {
      name,
      symbol,
      total_supply: totalSupply,
      available_supply: totalSupply,
      current_price: currentPrice,
      authority
    }
  };
  
  // Get existing stocks
  const stocks = loadStocks(authority);
  
  // Check if stock with this symbol already exists
  const existingIndex = stocks.findIndex(s => 
    s.account.symbol.toLowerCase() === symbol.toLowerCase() && 
    s.account.authority.toString() === authority.toString()
  );
  
  if (existingIndex >= 0) {
    // Replace existing stock
    stocks[existingIndex] = newStock;
  } else {
    // Add new stock
    stocks.push(newStock);
  }
  
  // Save updated stocks
  saveStocks(stocks);
  
  return newStock;
}

// Get some initial mock stocks
function getInitialStocks(currentAuthority: PublicKey): MockStock[] {
  const demoAuthority = new PublicKey('C1EuT9VokAKLiW7i2ingX3AAKdCXRyFep7pvKQCyTukJ');
  
  return [
    {
      publicKey: getStockPublicKey('SOL', demoAuthority),
      account: {
        name: 'Solana',
        symbol: 'SOL',
        total_supply: 10000,
        available_supply: 8000,
        current_price: 100,
        authority: demoAuthority
      }
    },
    {
      publicKey: getStockPublicKey('ETH', demoAuthority),
      account: {
        name: 'Ethereum',
        symbol: 'ETH',
        total_supply: 5000,
        available_supply: 3000,
        current_price: 300,
        authority: demoAuthority
      }
    },
    {
      publicKey: getStockPublicKey('BTC', demoAuthority),
      account: {
        name: 'Bitcoin',
        symbol: 'BTC',
        total_supply: 2100,
        available_supply: 1800,
        current_price: 5000,
        authority: demoAuthority
      }
    },
    {
      publicKey: getStockPublicKey('DEMO', currentAuthority),
      account: {
        name: 'Demo Stock',
        symbol: 'DEMO',
        total_supply: 1000,
        available_supply: 1000,
        current_price: 50,
        authority: currentAuthority
      }
    }
  ];
}

// Load portfolio positions for a wallet
export function loadPortfolio(walletPublicKey: PublicKey): PortfolioPosition[] {
  try {
    const portfolioKey = `${PORTFOLIO_KEY}_${walletPublicKey.toString()}`;
    const portfolioJson = localStorage.getItem(portfolioKey);
    
    if (!portfolioJson) {
      console.log('No portfolio data found for wallet:', walletPublicKey.toString());
      return [];
    }
    
    console.log('Raw portfolio data from localStorage:', portfolioJson);
    
    const portfolioData = JSON.parse(portfolioJson);
    
    if (!Array.isArray(portfolioData)) {
      console.error('Portfolio data is not an array:', portfolioData);
      return [];
    }
    
    console.log('Parsed portfolio data length:', portfolioData.length);
    
    const convertedPositions = portfolioData.map((position: any) => {
      try {
        const convertedPosition = {
          ...position,
          stockPublicKey: new PublicKey(position.stockPublicKey),
          quantity: Number(position.quantity) // Ensure quantity is a number
        };
        console.log('Converted position:', {
          symbol: convertedPosition.symbol,
          quantity: convertedPosition.quantity
        });
        return convertedPosition;
      } catch (error) {
        console.error('Error converting position in portfolio:', error, position);
        // Skip invalid entries
        return null;
      }
    }).filter(Boolean) as PortfolioPosition[];
    
    console.log('Final portfolio positions count:', convertedPositions.length);
    return convertedPositions;
  } catch (error) {
    console.error('Error loading portfolio:', error);
    return [];
  }
}

// Save portfolio positions to localStorage
export function savePortfolio(walletPublicKey: PublicKey, positions: PortfolioPosition[]): void {
  try {
    const portfolioKey = `${PORTFOLIO_KEY}_${walletPublicKey.toString()}`;
    
    console.log('Saving portfolio for wallet:', walletPublicKey.toString());
    console.log('Number of positions to save:', positions.length);
    
    // Convert PublicKeys to strings for storage
    const portfolioData = positions.map(position => {
      // Create a clean object to ensure no unexpected properties
      const cleanPosition = {
        stockPublicKey: position.stockPublicKey.toString(),
        symbol: position.symbol,
        name: position.name,
        quantity: Number(position.quantity),
        averagePrice: Number(position.averagePrice),
        currentPrice: Number(position.currentPrice)
      };
      
      console.log('Saving position:', {
        symbol: cleanPosition.symbol,
        quantity: cleanPosition.quantity
      });
      
      return cleanPosition;
    });
    
    const jsonData = JSON.stringify(portfolioData);
    console.log('Portfolio data size in bytes:', jsonData.length);
    
    localStorage.setItem(portfolioKey, jsonData);
    console.log('Portfolio saved successfully');
    
    // Verify the data was saved correctly
    const savedData = localStorage.getItem(portfolioKey);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('Verification - saved positions count:', parsedData.length);
    }
  } catch (error) {
    console.error('Error saving portfolio:', error);
  }
}

// Execute a buy transaction
export function executeBuy(
  walletPublicKey: PublicKey,
  stockPublicKey: PublicKey,
  quantity: number,
  price: number
): boolean {
  try {
    // Make sure we have a valid PublicKey object
    if (!(stockPublicKey instanceof PublicKey)) {
      console.error('Invalid stockPublicKey in executeBuy:', stockPublicKey);
      return false;
    }

    // Get the string representation for comparison
    const stockPublicKeyStr = stockPublicKey.toString();
    console.log('Executing buy for stock:', stockPublicKeyStr);
    
    // Load all stocks, not just ones owned by the wallet
    const stocks = loadStocks(walletPublicKey);
    console.log('Loaded stocks count:', stocks.length);
    
    if (stocks.length === 0) {
      console.error('No stocks found in loadStocks');
      return false;
    }
    
    // Log the first few stocks for debugging
    stocks.slice(0, 3).forEach((s, i) => {
      console.log(`Stock ${i}:`, {
        publicKey: s.publicKey.toString(),
        symbol: s.account.symbol,
        supply: s.account.available_supply
      });
    });
    
    const stockIndex = stocks.findIndex(s => 
      s.publicKey.toString() === stockPublicKeyStr
    );
    
    if (stockIndex === -1) {
      console.error('Stock not found:', stockPublicKeyStr);
      return false;
    }
    
    const stock = stocks[stockIndex];
    
    // Check if enough supply is available
    if (stock.account.available_supply < quantity) {
      console.error(`Not enough available supply: ${stock.account.available_supply} < ${quantity}`);
      return false;
    }
    
    // Update available supply
    stocks[stockIndex].account.available_supply -= quantity;
    saveStocks(stocks);
    
    // Update portfolio
    const portfolio = loadPortfolio(walletPublicKey);
    const positionIndex = portfolio.findIndex(p => 
      p.stockPublicKey.toString() === stockPublicKeyStr
    );
    
    if (positionIndex >= 0) {
      // Update existing position
      const position = portfolio[positionIndex];
      const newQuantity = position.quantity + quantity;
      const newAveragePrice = (position.averagePrice * position.quantity + price * quantity) / newQuantity;
      
      portfolio[positionIndex] = {
        ...position,
        quantity: newQuantity,
        averagePrice: newAveragePrice,
        currentPrice: stock.account.current_price
      };
    } else {
      // Create new position
      portfolio.push({
        stockPublicKey: stock.publicKey,
        symbol: stock.account.symbol,
        name: stock.account.name,
        quantity: quantity,
        averagePrice: price,
        currentPrice: stock.account.current_price
      });
    }
    
    savePortfolio(walletPublicKey, portfolio);
    console.log(`Successfully bought ${quantity} shares of ${stock.account.symbol}`);
    return true;
  } catch (error) {
    console.error('Buy execution error:', error);
    return false;
  }
}

// Execute a sell transaction
export function executeSell(
  walletPublicKey: PublicKey,
  stockPublicKey: PublicKey,
  quantity: number,
  price: number
): boolean {
  try {
    // Make sure we have a valid PublicKey object
    if (!(stockPublicKey instanceof PublicKey)) {
      console.error('Invalid stockPublicKey in executeSell:', stockPublicKey);
      return false;
    }

    // Get the string representation for comparison
    const stockPublicKeyStr = stockPublicKey.toString();
    console.log('Executing sell for stock:', stockPublicKeyStr);
    
    // Load portfolio and check if the user owns enough shares
    const portfolio = loadPortfolio(walletPublicKey);
    const positionIndex = portfolio.findIndex(p => 
      p.stockPublicKey.toString() === stockPublicKeyStr
    );
    
    if (positionIndex === -1) {
      console.error('Stock not in portfolio:', stockPublicKeyStr);
      return false;
    }
    
    const position = portfolio[positionIndex];
    
    if (position.quantity < quantity) {
      console.error(`Not enough shares to sell: ${position.quantity} < ${quantity}`);
      return false;
    }
    
    // Load all stocks, not just ones owned by the wallet
    const stocks = loadStocks(walletPublicKey);
    console.log('Loaded stocks count for sell:', stocks.length);
    
    if (stocks.length === 0) {
      console.error('No stocks found in loadStocks during sell operation');
      return false;
    }
    
    // Log the first few stocks for debugging
    stocks.slice(0, 3).forEach((s, i) => {
      console.log(`Stock ${i} for sell:`, {
        publicKey: s.publicKey.toString(),
        symbol: s.account.symbol,
        supply: s.account.available_supply
      });
    });
    
    const stockIndex = stocks.findIndex(s => 
      s.publicKey.toString() === stockPublicKeyStr
    );
    
    if (stockIndex === -1) {
      console.error('Stock not found in stocks list:', stockPublicKeyStr);
      return false;
    }
    
    // Update available supply
    stocks[stockIndex].account.available_supply += quantity;
    saveStocks(stocks);
    
    // Update portfolio position
    const newQuantity = position.quantity - quantity;
    
    if (newQuantity > 0) {
      // Update position
      portfolio[positionIndex] = {
        ...position,
        quantity: newQuantity,
        currentPrice: price
      };
    } else {
      // Remove position if quantity is 0
      portfolio.splice(positionIndex, 1);
    }
    
    savePortfolio(walletPublicKey, portfolio);
    console.log(`Successfully sold ${quantity} shares of ${stocks[stockIndex].account.symbol}`);
    return true;
  } catch (error) {
    console.error('Sell execution error:', error);
    return false;
  }
}

// Calculate total portfolio value
export function calculatePortfolioValue(walletPublicKey: PublicKey): number {
  try {
    const portfolio = loadPortfolio(walletPublicKey);
    const stocks = loadStocks(walletPublicKey);
    
    // Update current prices in portfolio
    const updatedPortfolio = portfolio.map(position => {
      const stock = stocks.find(s => s.publicKey.toString() === position.stockPublicKey.toString());
      return {
        ...position,
        currentPrice: stock ? stock.account.current_price : position.currentPrice
      };
    });
    
    // Save updated portfolio
    savePortfolio(walletPublicKey, updatedPortfolio);
    
    // Calculate total value
    return updatedPortfolio.reduce(
      (total, position) => total + (position.quantity * position.currentPrice),
      0
    );
  } catch (error) {
    console.error('Error calculating portfolio value:', error);
    return 0;
  }
}

// Debug function to clear all data - helpful for testing
export function clearAllMockData(): void {
  try {
    localStorage.removeItem(getGlobalStocksKey());
    localStorage.removeItem('force_reset_stocks');
    
    // Clear all portfolio data by getting all keys that start with PORTFOLIO_KEY
    const portfolioKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PORTFOLIO_KEY)) {
        portfolioKeys.push(key);
      }
    }
    
    portfolioKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('All mock data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing mock data:', error);
  }
}

// Direct function to attempt a buy with minimal dependencies
export function simpleBuy(
  walletKey: string,
  stockKey: string,
  symbol: string,
  name: string,
  quantity: number,
  price: number
): boolean {
  try {
    console.log(`Simple buy: ${quantity} ${symbol} at ${price} SOL by wallet ${walletKey.substring(0, 8)}...`);
    
    // Store this purchase directly in localStorage
    const portfolioKey = `${PORTFOLIO_KEY}_${walletKey}`;
    let portfolioData = [];
    
    try {
      const existingData = localStorage.getItem(portfolioKey);
      if (existingData) {
        portfolioData = JSON.parse(existingData);
        console.log('Existing portfolio data found with positions:', portfolioData.length);
      } else {
        console.log('No existing portfolio data found, creating new portfolio');
      }
    } catch (e) {
      console.error('Error loading existing portfolio data', e);
    }
    
    // Check if position already exists
    const positionIndex = portfolioData.findIndex((p: any) => 
      p.stockPublicKey === stockKey
    );
    
    console.log('Position check - found at index:', positionIndex);
    
    if (positionIndex >= 0) {
      // Update existing position
      const position = portfolioData[positionIndex];
      const currentQuantity = Number(position.quantity);
      const newQuantity = currentQuantity + quantity;
      const newAveragePrice = (position.averagePrice * currentQuantity + price * quantity) / newQuantity;
      
      portfolioData[positionIndex] = {
        ...position,
        quantity: newQuantity,
        averagePrice: newAveragePrice,
        currentPrice: price
      };
      
      console.log('Updated existing position:', {
        symbol,
        oldQuantity: currentQuantity,
        newQuantity: newQuantity
      });
    } else {
      // Add new position
      const newPosition = {
        stockPublicKey: stockKey,
        symbol,
        name, 
        quantity,
        averagePrice: price,
        currentPrice: price
      };
      
      portfolioData.push(newPosition);
      console.log('Added new position:', {
        symbol,
        quantity
      });
    }
    
    // Save portfolio data
    const jsonData = JSON.stringify(portfolioData);
    localStorage.setItem(portfolioKey, jsonData);
    console.log('Portfolio saved with positions count:', portfolioData.length);
    
    // Also update stock availability
    try {
      const stocksKey = getGlobalStocksKey();
      const stocksData = localStorage.getItem(stocksKey);
      
      if (stocksData) {
        const stocks = JSON.parse(stocksData);
        const stockIndex = stocks.findIndex((s: any) => s.publicKey === stockKey);
        
        if (stockIndex >= 0) {
          // Reduce available supply
          if (stocks[stockIndex].account.available_supply >= quantity) {
            stocks[stockIndex].account.available_supply -= quantity;
            localStorage.setItem(stocksKey, JSON.stringify(stocks));
            console.log('Updated stock available supply');
          }
        }
      }
    } catch (e) {
      console.error('Error updating stock availability', e);
    }
    
    return true;
  } catch (error) {
    console.error('Simple buy error:', error);
    return false;
  }
}

// Direct function to attempt a sell with minimal dependencies
export function simpleSell(
  walletKey: string,
  stockKey: string,
  quantity: number,
  price: number
): boolean {
  try {
    console.log(`Simple sell: ${quantity} shares with key ${stockKey.substring(0, 8)}... at ${price} SOL by wallet ${walletKey.substring(0, 8)}...`);
    
    // Check if user has enough shares
    const portfolioKey = `${PORTFOLIO_KEY}_${walletKey}`;
    let portfolioData = [];
    
    try {
      const existingData = localStorage.getItem(portfolioKey);
      if (existingData) {
        portfolioData = JSON.parse(existingData);
        console.log('Existing portfolio data found with positions:', portfolioData.length);
      } else {
        console.log('No existing portfolio data found, cannot sell');
        return false;
      }
    } catch (e) {
      console.error('Error loading existing portfolio data', e);
      return false;
    }
    
    // Find the position
    const positionIndex = portfolioData.findIndex((p: any) => 
      p.stockPublicKey === stockKey
    );
    
    if (positionIndex === -1) {
      console.error('Stock not in portfolio');
      return false;
    }
    
    const position = portfolioData[positionIndex];
    const currentQuantity = Number(position.quantity);
    
    console.log('Found position with quantity:', currentQuantity);
    
    if (currentQuantity < quantity) {
      console.error(`Not enough shares: ${currentQuantity} < ${quantity}`);
      return false;
    }
    
    // Update portfolio position
    const newQuantity = currentQuantity - quantity;
    console.log('New quantity after sell will be:', newQuantity);
    
    if (newQuantity > 0) {
      // Update position
      portfolioData[positionIndex] = {
        ...position,
        quantity: newQuantity,
        currentPrice: price
      };
      console.log('Updated position with new quantity:', newQuantity);
    } else {
      // Remove position
      console.log('Removing position completely as quantity is 0');
      portfolioData.splice(positionIndex, 1);
    }
    
    // Save portfolio data
    const jsonData = JSON.stringify(portfolioData);
    localStorage.setItem(portfolioKey, jsonData);
    console.log('Saved portfolio with positions count:', portfolioData.length);
    
    // Also update stock availability
    try {
      const stocksKey = getGlobalStocksKey();
      const stocksData = localStorage.getItem(stocksKey);
      
      if (stocksData) {
        const stocks = JSON.parse(stocksData);
        const stockIndex = stocks.findIndex((s: any) => s.publicKey === stockKey);
        
        if (stockIndex >= 0) {
          // Increase available supply
          stocks[stockIndex].account.available_supply += quantity;
          localStorage.setItem(stocksKey, JSON.stringify(stocks));
          console.log('Updated stock available supply');
        }
      }
    } catch (e) {
      console.error('Error updating stock availability', e);
    }
    
    return true;
  } catch (error) {
    console.error('Simple sell error:', error);
    return false;
  }
} 