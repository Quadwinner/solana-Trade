import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '../ui/ui-layout'
import { useSolanaTradeProgram, useSolanaTradeProgramAccount } from './SolanaTrade-data-access'
import toast from 'react-hot-toast'

export function SolanaTradeCreate() {
  const { initialize } = useSolanaTradeProgram()

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync()}
      disabled={initialize.isPending}
    >
      Create Stock {initialize.isPending && '...'}
    </button>
  )
}

export function SolanaTradeList() {
  const { accounts, getProgramAccount } = useSolanaTradeProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <SolanaTradeCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function SolanaTradeCard({ account }: { account: PublicKey }) {
  const { accountQuery, incrementMutation, setMutation, decrementMutation, closeMutation } = useSolanaTradeProgramAccount({
    account,
  })

  const stockData = useMemo(() => accountQuery.data, [accountQuery.data])

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2 className="card-title justify-center text-3xl cursor-pointer" onClick={() => accountQuery.refetch()}>
            {stockData?.name || "Unknown Stock"}
          </h2>
          
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Symbol</div>
              <div className="stat-value text-lg">{stockData?.symbol || "???"}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Price</div>
              <div className="stat-value text-lg">{stockData?.current_price?.toString() || "0"}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Supply</div>
              <div className="stat-value text-lg">{stockData?.total_supply?.toString() || "0"}</div>
            </div>
          </div>
          
          <div className="card-actions justify-around">
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => toast.success("Trading features coming soon!")}
            >
              Trade
            </button>
          </div>
          
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (!window.confirm('Are you sure you want to close this account?')) {
                  return
                }
                return closeMutation.mutateAsync()
              }}
              disabled={closeMutation.isPending}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
