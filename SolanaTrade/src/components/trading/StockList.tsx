import { useState, useEffect } from 'react'
import { useAnchorClient } from '../../contexts/AnchorClientContext'
import { PublicKey } from '@solana/web3.js'
import { useNavigate } from 'react-router-dom'

interface Stock {
  id: string
  name: string
  symbol: string
  price: number
  change: number
  volume: string
  market_cap: string
  publicKey?: PublicKey
}

export const StockList = () => {
  const { client, isInitialized } = useAnchorClient()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const [stocks, setStocks] = useState<Stock[]>([
    {
      id: '1',
      name: 'Solana Labs',
      symbol: 'SLB',
      price: 234.56,
      change: 5.67,
      volume: '1.2M SOL',
      market_cap: '45.7M SOL'
    },
    {
      id: '2',
      name: 'Anchor Protocol',
      symbol: 'ANC',
      price: 78.12,
      change: -2.34,
      volume: '890K SOL',
      market_cap: '23.5M SOL'
    },
    {
      id: '3',
      name: 'Serum Exchange',
      symbol: 'SRM',
      price: 123.45,
      change: 1.23,
      volume: '1.5M SOL',
      market_cap: '34.6M SOL'
    },
    {
      id: '4',
      name: 'Pyth Network',
      symbol: 'PYT',
      price: 45.67,
      change: -1.45,
      volume: '567K SOL',
      market_cap: '12.8M SOL'
    },
    {
      id: '5',
      name: 'Marinade Finance',
      symbol: 'MRD',
      price: 89.32,
      change: 3.21,
      volume: '789K SOL',
      market_cap: '19.3M SOL'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Stock
    direction: 'ascending' | 'descending'
  }>({ key: 'market_cap', direction: 'descending' })

  // Fetch stocks from blockchain
  useEffect(() => {
    const fetchStocks = async () => {
      if (client && isInitialized) {
        setLoading(true);
        try {
          const stockAccounts = await client.getAllStocks();
          
          if (stockAccounts.length > 0) {
            const fetchedStocks = stockAccounts.map((stockAccount, index) => {
              const currentPrice = stockAccount.account.currentPrice.toNumber() / 1e9; // Convert from lamports to SOL
              const totalSupply = stockAccount.account.totalSupply.toNumber();
              
              // Calculate market cap (price * total supply)
              const marketCap = currentPrice * totalSupply;
              let marketCapString = '';
              
              if (marketCap > 1000000) {
                marketCapString = `${(marketCap / 1000000).toFixed(1)}M SOL`;
              } else if (marketCap > 1000) {
                marketCapString = `${(marketCap / 1000).toFixed(1)}K SOL`;
              } else {
                marketCapString = `${marketCap.toFixed(2)} SOL`;
              }
              
              // Generate random change value for demo (-5% to +5%)
              const change = (Math.random() * 10) - 5;
              
              // Generate random volume
              const volume = `${(Math.random() * 2 + 0.5).toFixed(1)}M SOL`;
              
              return {
                id: index.toString(),
                name: stockAccount.account.name,
                symbol: stockAccount.account.symbol,
                price: currentPrice,
                change,
                volume,
                market_cap: marketCapString,
                publicKey: stockAccount.publicKey
              };
            });
            
            setStocks(fetchedStocks);
          }
        } catch (error) {
          console.error('Error fetching stocks:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStocks();
  }, [client, isInitialized]);

  const handleSort = (key: keyof Stock) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const sortedStocks = [...stocks].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1
    }
    return 0
  })

  const filteredStocks = sortedStocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const handleTradeClick = (stock: Stock) => {
    // Navigate to the trade tab and select this stock
    navigate('/dashboard', { state: { activeTab: 'trade', selectedStock: stock } });
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h3 className="text-lg font-medium leading-6 text-white mb-3 md:mb-0">Available Stocks</h3>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              className="bg-slate-700 border border-slate-600 text-white block w-full pl-3 pr-10 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>Name</span>
                      {sortConfig.key === 'name' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center">
                      <span>Symbol</span>
                      {sortConfig.key === 'symbol' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">
                      <span>Price</span>
                      {sortConfig.key === 'price' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('change')}
                  >
                    <div className="flex items-center">
                      <span>Change (24h)</span>
                      {sortConfig.key === 'change' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('volume')}
                  >
                    <div className="flex items-center">
                      <span>Volume</span>
                      {sortConfig.key === 'volume' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('market_cap')}
                  >
                    <div className="flex items-center">
                      <span>Market Cap</span>
                      {sortConfig.key === 'market_cap' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-slate-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {stock.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {stock.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {stock.price.toFixed(2)} SOL
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          stock.change > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {stock.volume}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {stock.market_cap}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm font-medium"
                          onClick={() => handleTradeClick(stock)}
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                      {searchTerm ? 'No stocks found matching your search.' : 'No stocks available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 