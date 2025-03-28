// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import SolanaTradeIDL from '../target/idl/SolanaTrade.json'
import type { SolanaTrade } from '../target/types/SolanaTrade'

// Re-export the generated IDL and type
export { SolanaTrade, SolanaTradeIDL }

// The programId is imported from the program IDL.
export const SOLANA_TRADE_PROGRAM_ID = new PublicKey(SolanaTradeIDL.address)

// This is a helper function to get the SolanaTrade Anchor program.
export function getSolanaTradeProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...SolanaTradeIDL, address: address ? address.toBase58() : SolanaTradeIDL.address } as SolanaTrade, provider)
}

// This is a helper function to get the program ID for the SolanaTrade program depending on the cluster.
export function getSolanaTradeProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the SolanaTrade program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return SOLANA_TRADE_PROGRAM_ID
  }
}
