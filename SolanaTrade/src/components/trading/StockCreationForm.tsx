import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useSolanaTradeProgram } from '../SolanaTrade/SolanaTrade-data-access';
import { useAnchorClient } from '../../contexts/AnchorClientContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { createMockStock } from './MockStockService';
import { Link } from 'react-router-dom';

export function StockCreationForm() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('1000');
  const [currentPrice, setCurrentPrice] = useState('100');
  const [isCreating, setIsCreating] = useState(false);

  const { programId } = useSolanaTradeProgram();
  const { isInitialized } = useAnchorClient();
  const { publicKey } = useWallet();
  const { isAdmin, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isInitialized) {
      toast.error('Blockchain connection not initialized');
      return;
    }
    
    if (!publicKey) {
      toast.error('Wallet not connected');
      return;
    }
    
    if (!isAdmin) {
      toast.error('Admin access required to create stocks');
      return;
    }
    
    if (!name || !symbol) {
      toast.error('Please provide both name and symbol');
      return;
    }
    
    if (name.length > 31) {
      toast.error('Name must be less than 32 characters');
      return;
    }
    
    if (symbol.length > 11) {
      toast.error('Symbol must be less than 12 characters');
      return;
    }
    
    try {
      setIsCreating(true);
      
      console.log(`Creating stock: ${name} (${symbol})`);
      console.log(`Supply: ${totalSupply}, Price: ${currentPrice}`);
      console.log(`Creator is admin: ${isAdmin}`);
      
      // Create a mock stock using our service
      const createdStock = createMockStock(
        name,
        symbol,
        Number(totalSupply),
        Number(currentPrice),
        publicKey
      );
      
      console.log(`Stock created with address: ${createdStock.publicKey.toString()}`);
      
      toast.success(`Stock created successfully: ${symbol}`);
      
      // Reset form after successful creation
      setName('');
      setSymbol('');
      setTotalSupply('1000');
      setCurrentPrice('100');
      
    } catch (error) {
      console.error('Error creating stock:', error);
      if (error instanceof Error) {
        toast.error(`Failed to create stock: ${error.message}`);
      } else {
        toast.error('Failed to create stock: Unknown error');
      }
    } finally {
      setIsCreating(false);
    }
  };
  
  // Show login prompt if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="card bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-white">Create New Stock</h2>
          <div className="badge badge-secondary mb-4">Admin Access Required</div>
          
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold">Admin Access Required</h3>
              <div className="text-sm">You need admin privileges to create stocks.</div>
            </div>
          </div>
          
          <Link to="/login" className="btn bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 text-white shadow-md shadow-purple-500/20 mt-4">
            Log In as Admin
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="card-title text-white">Create New Stock</h2>
            <div className="badge badge-accent">Admin Access</div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-900/30 to-indigo-900/20 p-2 rounded-lg">
            <div className="text-sm text-green-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Status: Active
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-slate-300">Stock Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Solana Trade Inc."
              className="input input-bordered bg-slate-800 text-white border-slate-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={31}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text text-slate-300">Stock Symbol</span>
            </label>
            <input
              type="text"
              placeholder="e.g. STI"
              className="input input-bordered bg-slate-800 text-white border-slate-700"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              required
              maxLength={11}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300">Total Supply</span>
              </label>
              <input
                type="number"
                placeholder="1000"
                className="input input-bordered bg-slate-800 text-white border-slate-700"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                required
                min="1"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300">Initial Price (lamports)</span>
              </label>
              <input
                type="number"
                placeholder="100"
                className="input input-bordered bg-slate-800 text-white border-slate-700"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>
          
          <div className="form-control mt-6">
            <button
              type="submit"
              className="btn bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 text-white shadow-md shadow-purple-500/20"
              disabled={isCreating || !isInitialized || !publicKey}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 