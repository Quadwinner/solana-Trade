import { getSolanaTradeProgram, getSolanaTradeProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'

import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useSolanaTradeProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getSolanaTradeProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getSolanaTradeProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['SolanaTrade', 'all', { cluster }],
    queryFn: () => program.account.Stock.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createStock = useMutation({
    mutationKey: ['SolanaTrade', 'create_stock', { cluster }],
    mutationFn: async () => {
      try {
        const symbol = "DEMO"; // Default symbol
        const name = "Demo Stock"; // Default name
        const totalSupply = 1000; // Default total supply
        const currentPrice = 100; // Default price in lamports

        // Find the PDA for the stock
        const [stockPDA] = await PublicKey.findProgramAddressSync(
          [
            Buffer.from("stock"),
            provider.wallet.publicKey.toBuffer(),
            Buffer.from(symbol)
          ],
          programId
        );

        console.log("Creating stock with PDA:", stockPDA.toString());
        
        // Call the create_stock method from the IDL
        return program.methods
          .create_stock(name, symbol, totalSupply, currentPrice)
          .accounts({
            authority: provider.wallet.publicKey,
            stock: stockPDA,
            systemProgram: PublicKey.default,
          })
          .rpc();
      } catch (error) {
        console.error("Error creating stock:", error);
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error) => {
      console.error('Stock creation error:', error);
      toast.error(`Failed to create stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize: createStock,
  }
}

export function useSolanaTradeProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useSolanaTradeProgram()

  const accountQuery = useQuery({
    queryKey: ['SolanaTrade', 'fetch', { cluster, account }],
    queryFn: () => program.account.Stock.fetch(account),
  })

  // Since the original program methods don't exist in our IDL, we'll create simplified versions
  // that just show a toast message
  const closeMutation = useMutation({
    mutationKey: ['SolanaTrade', 'close', { cluster, account }],
    mutationFn: () => {
      toast.error("Close function not implemented in this version of the program");
      throw new Error("Not implemented");
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['SolanaTrade', 'decrement', { cluster, account }],
    mutationFn: () => {
      toast.error("Decrement function not implemented in this version of the program");
      throw new Error("Not implemented");
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['SolanaTrade', 'increment', { cluster, account }],
    mutationFn: () => {
      toast.error("Increment function not implemented in this version of the program");
      throw new Error("Not implemented");
    },
  })

  const setMutation = useMutation({
    mutationKey: ['SolanaTrade', 'set', { cluster, account }],
    mutationFn: (value: number) => {
      toast.error("Set function not implemented in this version of the program");
      throw new Error("Not implemented");
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
