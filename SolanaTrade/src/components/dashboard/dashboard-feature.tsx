import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MarketOverview } from '../trading/MarketOverview'
import { TradeForm } from '../trading/TradeForm'
import { WalletButton } from '../trading/WalletButton'
import { StockCreationForm } from '../trading/StockCreationForm'
import { MarketplaceFeature } from '../trading/MarketplaceFeature'
import { PortfolioFeature } from '../trading/PortfolioFeature'
import { RealTimeStockData } from '../trading/RealTimeStockData'
import { SimplifiedTradeForm } from '../trading/SimplifiedTradeForm'
import { PublicKey } from '@solana/web3.js'

export default function DashboardFeature() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'trade' | 'create' | 'allstocks'>('market')
  const [selectedStockForTrading, setSelectedStockForTrading] = useState<any>(null);
  const [tradeOrderType, setTradeOrderType] = useState<'buy' | 'sell'>('buy');

  // Handle location state changes - this allows other components to navigate and preset state
  useEffect(() => {
    if (location.state) {
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
        console.log('Setting active tab:', location.state.activeTab);
      }
      
      if (location.state.selectedStock) {
        // Deep clone the stock to ensure we don't get reference issues
        try {
          const stockData = location.state.selectedStock;
          console.log('Received stock from navigation:', stockData);
          
          // Ensure we have a properly formed stock object
          if (stockData && typeof stockData === 'object') {
            // Create a new stock object with the required properties
            const validStock = {
              ...stockData,
              // Ensure publicKey is a proper PublicKey object if it's a string
              publicKey: typeof stockData.publicKey === 'string' 
                ? new PublicKey(stockData.publicKey) 
                : stockData.publicKey,
              account: {
                ...stockData.account,
                // Ensure authority is a proper PublicKey object if it's a string
                authority: typeof stockData.account?.authority === 'string'
                  ? new PublicKey(stockData.account.authority)
                  : stockData.account?.authority
              }
            };
            
            setSelectedStockForTrading(validStock);
            console.log('Set selected stock for trading:', validStock);
          } else {
            console.error('Invalid stock data received:', stockData);
          }
        } catch (error) {
          console.error('Error processing selected stock:', error);
        }
      }
      
      if (location.state.orderType) {
        setTradeOrderType(location.state.orderType);
        console.log('Set order type:', location.state.orderType);
      }
      
      // Clear location state to avoid persisting
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto page-transition">
          <div className="rounded-full w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-700/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
          </div>
          <h1 className="text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 leading-tight">
            Solana Trading Platform
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Trade stocks securely on the blockchain with cutting-edge technology and real-time market data
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => setActiveTab('market')} className="btn-3d px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium shadow-lg shadow-indigo-700/20 hover:shadow-indigo-700/40 transition-all">
              View Marketplace
            </button>
            <button onClick={() => setActiveTab('create')} className="btn-3d px-6 py-3 bg-black/30 border border-white/10 rounded-lg text-white font-medium shadow-lg hover:bg-black/40 transition-all">
              Create Stock
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="glassmorphism p-1.5 rounded-2xl mb-8 shadow-lg flex flex-wrap">
          {[
            { id: 'market', label: 'Market', icon: (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )},
            { id: 'portfolio', label: 'My Portfolio', icon: (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )},
            { id: 'allstocks', label: 'All Stocks', icon: (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            )},
            { id: 'trade', label: 'Trade', icon: (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )},
            { id: 'create', label: 'Create Stock', icon: (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          ].map((tab) => (
            <button
              key={tab.id}
              className={`py-3 px-5 rounded-xl font-medium transition-all duration-300 flex-1 min-w-[120px] flex items-center justify-center ${
                activeTab === tab.id 
                  ? 'btn-gradient text-white shadow-lg' 
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Content */}
        <div className="page-transition">
          {/* Market Overview Panel - Always visible except for certain tabs */}
          {activeTab !== 'market' && activeTab !== 'portfolio' && activeTab !== 'allstocks' && (
            <div className="mb-8">
              <div className="card-shine">
                <MarketOverview />
              </div>
            </div>
          )}

          {/* Dynamic Content based on Tab */}
          <div className="glassmorphism p-6 rounded-2xl shadow-xl border border-slate-800/50">
            {activeTab === 'market' && <MarketplaceFeature />}
            {activeTab === 'portfolio' && <PortfolioFeature />}
            {activeTab === 'allstocks' && <RealTimeStockData />}
            {activeTab === 'trade' && (
              <SimplifiedTradeForm 
                initialStock={selectedStockForTrading} 
                initialOrderType={tradeOrderType}
              />
            )}
            {activeTab === 'create' && <StockCreationForm />}
          </div>
          
          {/* Quick Stats Section */}
          {activeTab === 'market' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div className="stats-card">
                <div className="stats-card-indicator w-1/3"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Total Trading Volume</h3>
                    <p className="text-2xl font-bold text-white mt-1">$2.4M</p>
                  </div>
                  <div className="p-2 bg-indigo-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm text-green-400 flex items-center mt-2">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>+12.5% from last week</span>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-indicator w-2/3"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Active Traders</h3>
                    <p className="text-2xl font-bold text-white mt-1">1,254</p>
                  </div>
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm text-green-400 flex items-center mt-2">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>+7.2% from last week</span>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-indicator w-1/2"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Available Stocks</h3>
                    <p className="text-2xl font-bold text-white mt-1">48</p>
                  </div>
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm text-green-400 flex items-center mt-2">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>+3 new listings this week</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
