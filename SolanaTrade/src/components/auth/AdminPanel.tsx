import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { loadStocks, MockStock, loadPortfolio } from '../trading/MockStockService';

export function AdminPanel() {
  const [stocks, setStocks] = useState<MockStock[]>([]);
  const [users, setUsers] = useState<{publicKey: string, stocksCount: number, portfolioCount: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stocks' | 'users' | 'settings'>('overview');
  
  const { publicKey } = useWallet();
  
  useEffect(() => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      // Load all stocks
      const allStocks = loadStocks(publicKey);
      setStocks(allStocks);
      
      // Create a map of users based on stock authority
      const userMap = new Map<string, {
        publicKey: string,
        stocksCount: number,
        portfolioCount: number
      }>();
      
      // Count stocks per user
      allStocks.forEach(stock => {
        const authority = stock.account.authority.toString();
        if (!userMap.has(authority)) {
          userMap.set(authority, {
            publicKey: authority,
            stocksCount: 0,
            portfolioCount: 0
          });
        }
        
        const userData = userMap.get(authority)!;
        userData.stocksCount++;
        userMap.set(authority, userData);
      });
      
      // Try to load portfolio data for each user
      userMap.forEach((userData, key) => {
        try {
          const portfolio = loadPortfolio(new PublicKey(key));
          userData.portfolioCount = portfolio.length;
          userMap.set(key, userData);
        } catch (err) {
          console.error(`Error loading portfolio for ${key}`, err);
        }
      });
      
      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
      console.log("error is loaded:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);
  
  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>
      
      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-black/20 rounded-2xl backdrop-blur-sm">
        <button 
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'overview' 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'stocks' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('stocks')}
        >
          Manage Stocks
        </button>
        <button 
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'users' 
              ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg shadow-green-600/20' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'settings' 
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-blue-500"></span>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden backdrop-blur-sm bg-black/30 border border-white/5 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Platform Statistics</h2>
              
              <div className="stats shadow bg-gradient-to-r from-slate-800 to-slate-900 text-white w-full">
                <div className="stat">
                  <div className="stat-figure text-purple-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="stat-title text-slate-400">Total Stocks</div>
                  <div className="stat-value text-purple-400">{stocks.length}</div>
                  <div className="stat-desc text-slate-400">Listed on marketplace</div>
                </div>
                
                <div className="stat">
                  <div className="stat-figure text-blue-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="stat-title text-slate-400">Users</div>
                  <div className="stat-value text-blue-400">{users.length}</div>
                  <div className="stat-desc text-slate-400">Unique wallets</div>
                </div>
                
                <div className="stat">
                  <div className="stat-figure text-green-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="stat-title text-slate-400">Portfolio Positions</div>
                  <div className="stat-value text-green-400">
                    {users.reduce((acc, user) => acc + user.portfolioCount, 0)}
                  </div>
                  <div className="stat-desc text-slate-400">Active investments</div>
                </div>
              </div>
              
              <div className="mt-8 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold mb-4 text-white">Admin Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 p-4 shadow-lg">
                    <h4 className="font-bold text-indigo-300 mb-2">Create Stock</h4>
                    <p className="text-sm text-slate-400 mb-4">Create a new stock for the marketplace</p>
                    <button 
                      className="btn btn-sm bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white"
                      onClick={() => window.location.href = '/dashboard?tab=createStock'}
                    >
                      Create Stock
                    </button>
                  </div>
                  
                  <div className="card bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/20 p-4 shadow-lg">
                    <h4 className="font-bold text-blue-300 mb-2">Manage Users</h4>
                    <p className="text-sm text-slate-400 mb-4">View and manage platform users</p>
                    <button 
                      className="btn btn-sm bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white"
                      onClick={() => setActiveTab('users')}
                    >
                      View Users
                    </button>
                  </div>
                  
                  <div className="card bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/20 p-4 shadow-lg">
                    <h4 className="font-bold text-green-300 mb-2">Stock Analytics</h4>
                    <p className="text-sm text-slate-400 mb-4">View trading activity and statistics</p>
                    <button 
                      className="btn btn-sm bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white"
                      onClick={() => setActiveTab('stocks')}
                    >
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Stocks Tab */}
          {activeTab === 'stocks' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Manage Stocks</h2>
              
              <div className="overflow-x-auto">
                <table className="table w-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 text-white">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="text-slate-400">Stock</th>
                      <th className="text-slate-400">Symbol</th>
                      <th className="text-slate-400 text-right">Total Supply</th>
                      <th className="text-slate-400 text-right">Available</th>
                      <th className="text-slate-400 text-right">Price</th>
                      <th className="text-slate-400">Owner</th>
                      <th className="text-slate-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => (
                      <tr key={stock.publicKey.toString()} className="hover:bg-slate-800/50">
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white font-bold">{stock.account.symbol.substring(0, 1)}</span>
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">{stock.account.name}</div>
                              <div className="text-xs text-slate-400 font-mono">
                                {stock.publicKey.toString().substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{stock.account.symbol}</td>
                        <td className="text-right">{stock.account.total_supply.toLocaleString()}</td>
                        <td className="text-right">{stock.account.available_supply.toLocaleString()}</td>
                        <td className="text-right">{stock.account.current_price.toFixed(4)} ◎</td>
                        <td>
                          <div className="text-xs text-slate-400 font-mono">
                            {stock.account.authority.toString().substring(0, 8)}...
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-xs bg-slate-700 hover:bg-slate-600 text-white border-0">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Platform Users</h2>
              
              <div className="overflow-x-auto">
                <table className="table w-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 text-white">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="text-slate-400">User Wallet</th>
                      <th className="text-slate-400 text-center">Stocks Created</th>
                      <th className="text-slate-400 text-center">Portfolio Positions</th>
                      <th className="text-slate-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.publicKey} className="hover:bg-slate-800/50">
                        <td>
                          <div className="font-mono text-sm">{user.publicKey}</div>
                        </td>
                        <td className="text-center">
                          <div className="badge badge-lg bg-blue-900 text-blue-300 border-blue-700">
                            {user.stocksCount}
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="badge badge-lg bg-green-900 text-green-300 border-green-700">
                            {user.portfolioCount}
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-xs bg-slate-700 hover:bg-slate-600 text-white border-0">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Platform Settings</h2>
              
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl p-6 border border-slate-700/50 mb-6">
                <h3 className="text-xl font-bold mb-4 text-white">Admin Wallet Addresses</h3>
                <p className="text-slate-400 mb-4">
                  Add or remove wallet addresses that have admin privileges. These wallets will be able to create stocks and access the admin panel.
                </p>
                
                <div className="alert alert-info mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Development Mode: Currently, any connected wallet is granted admin privileges for testing purposes.</span>
                </div>
                
                <div className="bg-black/20 p-4 rounded-lg mb-4">
                  <div className="font-bold text-white mb-2">Current Admin Wallets</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                      <span className="font-mono text-xs text-blue-300">ANY_WALLET_IS_ADMIN</span>
                      <span className="badge badge-warning">Testing Mode</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                      <span className="font-mono text-xs text-blue-300">CauHK3m4DRTe6yPrBTDYQrzSvjsi8xN6BhppkZLCuZv9</span>
                      <span className="badge badge-success">User Admin</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                      <span className="font-mono text-xs text-blue-300">C1EuT9VokAKLiW7i2ingX3AAKdCXRyFep7pvKQCyTukJ</span>
                      <span className="badge badge-secondary">Admin Login</span>
                    </div>
                  </div>
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text text-slate-300">Admin Wallet Address</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter wallet address..."
                    className="input input-bordered bg-slate-800 text-white border-slate-700"
                  />
                </div>
                
                <button className="btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 text-white shadow-md shadow-blue-500/20">
                  Add Admin Wallet
                </button>
                
                <div className="mt-4 text-xs text-slate-500">
                  <p>Note: To modify admin wallets in development, update the ADMIN_WALLETS array in src/contexts/AuthContext.tsx.</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold mb-4 text-white">Platform Configuration</h3>
                
                <div className="form-control mb-4">
                  <label className="cursor-pointer label">
                    <span className="label-text text-slate-300">Enable User Registration</span> 
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                  </label>
                </div>
                
                <div className="form-control mb-4">
                  <label className="cursor-pointer label">
                    <span className="label-text text-slate-300">Allow Users to Create Stocks</span> 
                    <input type="checkbox" className="toggle toggle-primary" />
                  </label>
                </div>
                
                <div className="form-control mb-4">
                  <label className="cursor-pointer label">
                    <span className="label-text text-slate-300">Require Email Verification</span> 
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                  </label>
                </div>
                
                <button className="btn bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 text-white shadow-md shadow-green-500/20">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 