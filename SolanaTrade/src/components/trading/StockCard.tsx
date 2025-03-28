import { PublicKey } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import { ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import { useWallet } from '@solana/wallet-adapter-react';

interface StockCardProps {
  stockAccount: {
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
}

export function StockCard({ stockAccount }: StockCardProps) {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { 
    name, 
    symbol, 
    total_supply, 
    available_supply, 
    current_price, 
    authority 
  } = stockAccount.account;
  
  const isOwner = publicKey?.toString() === authority.toString();
  
  const handleTrade = () => {
    // Create a serializable version of the stock account
    const serializableStock = {
      publicKey: stockAccount.publicKey.toString(),
      account: {
        ...stockAccount.account,
        authority: stockAccount.account.authority.toString()
      }
    };
    
    console.log('Navigating to trade with stock:', serializableStock);
    
    navigate('/dashboard', { 
      state: { 
        activeTab: 'trade',
        selectedStock: stockAccount,
        orderType: 'buy'
      }
    });
  };

  // Calculate market cap
  const marketCap = current_price * total_supply;
  
  // Calculate availability percentage
  const availabilityPercentage = (available_supply / total_supply) * 100;

  return (
    <div className="card-shine glass-card hover-lift transition-all duration-300 group overflow-hidden relative border border-slate-700/30">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      
      <div className="card-body relative z-10 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="gradient-border rounded-xl mr-3">
              <div className="w-14 h-14 relative z-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all duration-300">
                <span className="text-white font-bold text-lg">{symbol.substring(0, 1)}</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient group-hover:text-glow transition-all duration-200">{symbol}</h2>
              <h3 className="text-sm text-slate-400">{name}</h3>
            </div>
          </div>
          
          {isOwner && (
            <div className="badge glassmorphism bg-gradient-to-r from-amber-400/20 to-orange-400/20 border-0 text-amber-300 font-semibold">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Owner
            </div>
          )}
        </div>
        
        <div className="mt-6 mb-4">
          <div className="flex items-center mb-2">
            <span className="text-sm text-slate-400 mr-2">Current Price</span>
            <div className="flex-grow h-px bg-slate-700/50"></div>
          </div>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 group-hover:text-glow">{current_price.toFixed(2)} ◎</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="glassmorphism rounded-xl p-4 group-hover:border-slate-600/50 transition-all">
            <div className="text-xs text-slate-400 mb-1">Available Supply</div>
            <div className="text-xl font-bold text-white">{available_supply.toLocaleString()}</div>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full animate-pulse-slow" 
                style={{ width: `${availabilityPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500 mt-2">{availabilityPercentage.toFixed(1)}% of total</div>
          </div>
          
          <div className="glassmorphism rounded-xl p-4 group-hover:border-slate-600/50 transition-all">
            <div className="text-xs text-slate-400 mb-1">Market Cap</div>
            <div className="text-xl font-bold text-white">{marketCap.toFixed(2)} ◎</div>
            <div className="flex items-center mt-3">
              <svg className="w-3 h-3 text-slate-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-slate-500">Total: {total_supply.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div className="card-actions justify-between items-center mt-4">
          <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors">
            <ExplorerLink 
              path={`account/${stockAccount.publicKey}`} 
              label={ellipsify(stockAccount.publicKey.toString())} 
            />
          </div>
          
          <button
            className="btn-3d btn-gradient shadow-lg shadow-blue-600/20 rounded-xl px-6 py-2 transform transition-all duration-200 hover:scale-105 text-white font-medium"
            onClick={handleTrade}
          >
            <svg className="w-4 h-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trade Now
          </button>
        </div>
      </div>
    </div>
  );
} 