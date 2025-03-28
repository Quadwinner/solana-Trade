import { useState, useEffect } from 'react'
import { useAnchorClient } from '../../contexts/AnchorClientContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useNavigate } from 'react-router-dom'

interface PortfolioPosition {
  id: string
  symbol: string
  name: string
  quantity: number
  avg_price: number
  current_price: number
  total_value: number
  profit_loss: number
  profit_loss_percent: number
  stockPublicKey?: PublicKey
}

export const MyPortfolio = () => {
  const { client, isInitialized } = useAnchorClient()
  const { connected, publicKey } = useWallet()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const [positions, setPositions] = useState<PortfolioPosition[]>([
    {
      id: '1',
      symbol: 'SLB',
      name: 'Solana Labs',
      quantity: 5.5,
      avg_price: 220.45,
      current_price: 234.56,
      total_value: 1290.08,
      profit_loss: 77.61,
      profit_loss_percent: 6.4
    },
    {
      id: '2',
      symbol: 'MRD',
      name: 'Marinade Finance',
      quantity: 12.2,
      avg_price: 85.21,
      current_price: 89.32,
      total_value: 1089.70,
      profit_loss: 50.09,
      profit_loss_percent: 4.8
    }
  ])

  // Fetch positions from blockchain
  useEffect(() => {
    const fetchPositions = async () => {
      if (client && isInitialized && connected && publicKey) {
        setLoading(true);
        try {
          // Get user's stock positions
          const positionAccounts = await client.getUserStockPositions();
          
          if (positionAccounts.length > 0) {
            // We need to get the stock details for each position
            const stockDetails = new Map();
            const stockAccounts = await client.getAllStocks();
            
            // Create a map of stock pubkey to stock details
            for (const stockAccount of stockAccounts) {
              stockDetails.set(
                stockAccount.publicKey.toString(), 
                {
                  name: stockAccount.account.name,
                  symbol: stockAccount.account.symbol,
                  price: stockAccount.account.currentPrice.toNumber() / 1e9 // Convert from lamports to SOL
                }
              );
            }
            
            // Map positions to the format our component needs
            const fetchedPositions = positionAccounts.map((posAccount, index) => {
              const stockInfo = stockDetails.get(posAccount.account.stock.toString());
              
              if (!stockInfo) {
                return null; // Skip positions where we couldn't find the stock
              }
              
              const quantity = posAccount.account.amount.toNumber();
              const avg_price = posAccount.account.entryPrice.toNumber() / 1e9; // Convert from lamports to SOL
              const current_price = stockInfo.price;
              const total_value = quantity * current_price;
              const investment = quantity * avg_price;
              const profit_loss = total_value - investment;
              const profit_loss_percent = (profit_loss / investment) * 100;
              
              return {
                id: index.toString(),
                symbol: stockInfo.symbol,
                name: stockInfo.name,
                quantity,
                avg_price,
                current_price,
                total_value,
                profit_loss,
                profit_loss_percent,
                stockPublicKey: posAccount.account.stock
              };
            }).filter(Boolean) as PortfolioPosition[];
            
            setPositions(fetchedPositions);
          }
        } catch (error) {
          console.error('Error fetching portfolio positions:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPositions();
  }, [client, isInitialized, connected, publicKey]);

  const totalInvestment = positions.reduce(
    (sum, position) => sum + position.quantity * position.avg_price,
    0
  )
  const portfolioValue = positions.reduce(
    (sum, position) => sum + position.total_value,
    0
  )
  const totalProfitLoss = positions.reduce(
    (sum, position) => sum + position.profit_loss,
    0
  )
  const profitLossPercentage = totalInvestment > 0
    ? (totalProfitLoss / totalInvestment) * 100
    : 0
    
  const handleTradeClick = (position: PortfolioPosition, action: 'buy' | 'sell') => {
    // Navigate to the trade tab and pre-select this stock with buy/sell option
    navigate('/dashboard', { 
      state: { 
        activeTab: 'trade', 
        orderType: action,
        selectedStock: {
          id: position.id,
          name: position.name,
          symbol: position.symbol,
          price: position.current_price,
          available: position.quantity,
          publicKey: position.stockPublicKey
        }
      } 
    });
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-white mb-4">My Portfolio</h3>
        
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
                  Please connect your wallet to view your portfolio.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-slate-700 rounded-lg px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-400 truncate">Portfolio Value</dt>
                <dd className="mt-1 text-2xl font-semibold text-white">{portfolioValue.toFixed(2)} SOL</dd>
              </div>
              <div className="bg-slate-700 rounded-lg px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-400 truncate">Total Investment</dt>
                <dd className="mt-1 text-2xl font-semibold text-white">{totalInvestment.toFixed(2)} SOL</dd>
              </div>
              <div className="bg-slate-700 rounded-lg px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-400 truncate">Total Profit/Loss</dt>
                <dd className={`mt-1 text-2xl font-semibold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} SOL
                </dd>
              </div>
              <div className="bg-slate-700 rounded-lg px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-400 truncate">Return</dt>
                <dd className={`mt-1 text-2xl font-semibold ${profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                </dd>
              </div>
            </div>

            {/* Positions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Avg. Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Profit/Loss
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {connected && positions.length > 0 ? (
                    positions.map((position) => (
                      <tr key={position.id} className="hover:bg-slate-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-white">{position.symbol}</div>
                              <div className="text-sm text-slate-400">{position.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">
                          {position.quantity.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">
                          {position.avg_price.toFixed(2)} SOL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-right">
                          {position.current_price.toFixed(2)} SOL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-right">
                          {position.total_value.toFixed(2)} SOL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`text-sm ${position.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.profit_loss >= 0 ? '+' : ''}{position.profit_loss.toFixed(2)} SOL
                          </div>
                          <div className={`text-sm ${position.profit_loss_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.profit_loss_percent >= 0 ? '+' : ''}{position.profit_loss_percent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button 
                            className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm font-medium mr-2"
                            onClick={() => handleTradeClick(position, 'buy')}
                          >
                            Buy
                          </button>
                          <button 
                            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-sm font-medium"
                            onClick={() => handleTradeClick(position, 'sell')}
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4M12 4v16m4-8h.01M5 8h.01M5 16h.01" />
                          </svg>
                          <p>Your portfolio is empty.</p>
                          <p className="mt-1">Start trading to build your portfolio!</p>
                          <button 
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                            onClick={() => navigate('/dashboard', { state: { activeTab: 'market' } })}
                          >
                            Explore Stocks
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 