import { useWallet } from '@solana/wallet-adapter-react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { useSolanaTradeProgram } from './SolanaTrade-data-access'
import { SolanaTradeCreate, SolanaTradeList } from './SolanaTrade-ui'
import { useAnchorClient } from '../../contexts/AnchorClientContext'

export default function SolanaTradeFeature() {
  const { publicKey } = useWallet()
  const { programId } = useSolanaTradeProgram()
  const { isInitialized, error, inFallbackMode } = useAnchorClient()

  return publicKey ? (
    <div>
      <AppHero
        title="SolanaTrade"
        subtitle={
          'Create a stock by clicking the "Create Stock" button. This will create a new stock record on-chain with some default values.'
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        
        {error && (
          <div className="alert alert-warning mb-4">
            <div className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 mx-2 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <label>{error}</label>
            </div>
          </div>
        )}
        
        {inFallbackMode && (
          <div className="alert alert-info mb-4">
            <div className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 mx-2 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <label>Running in limited functionality mode. Some features may not work properly.</label>
            </div>
          </div>
        )}
        
        <SolanaTradeCreate />
      </AppHero>
      <SolanaTradeList />
      
      {!isInitialized && (
        <div className="alert alert-error mt-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 mx-2 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>
            <label>The Anchor client is not properly initialized. Please check the console for more details.</label>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <div>
            <h1 className="text-5xl font-bold mb-6">SolanaTrade Program</h1>
            <p className="mb-6">Please connect your wallet to interact with the SolanaTrade program.</p>
            <WalletButton />
          </div>
        </div>
      </div>
    </div>
  )
}
