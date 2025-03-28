import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';

export function UserMenu() {
  const { isAuthenticated, isAdmin, username, logout } = useAuth();
  const { publicKey } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="dropdown dropdown-end">
      <button 
        className="btn btn-ghost btn-circle avatar"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
          {isAuthenticated 
            ? username?.charAt(0).toUpperCase() || 'U'
            : publicKey 
              ? publicKey.toString().substring(0, 2) 
              : 'G'}
        </div>
      </button>
      
      {isOpen && (
        <ul className="menu dropdown-content z-[1] p-2 shadow-lg bg-slate-800 rounded-box w-52 mt-2 border border-slate-700">
          {isAuthenticated ? (
            <>
              <li className="menu-title border-b border-slate-700 mb-2 pb-2">
                <div className="text-sm text-slate-400">Signed in as</div>
                <div className="font-medium text-white">{username}</div>
                {isAdmin && (
                  <span className="badge badge-sm bg-gradient-to-r from-purple-600 to-indigo-600 border-0 text-white">
                    Admin
                  </span>
                )}
              </li>
              
              {isAdmin && (
                <li>
                  <Link to="/admin" className="flex items-center gap-2 text-blue-300 hover:text-blue-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </Link>
                </li>
              )}
              
              <li>
                <Link to="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
              </li>
              
              <li>
                <Link to="/portfolio" className="flex items-center gap-2 text-slate-300 hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Portfolio
                </Link>
              </li>
              
              <li className="border-t border-slate-700 mt-2 pt-2">
                <button 
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="flex items-center gap-2 text-blue-300 hover:text-blue-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
              </li>
              
              {publicKey && (
                <li className="menu-title border-t border-slate-700 mt-2 pt-2">
                  <div className="text-xs text-slate-400">Wallet Connected</div>
                  <div className="text-xs text-slate-300 font-mono">{publicKey.toString().substring(0, 10)}...</div>
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
} 