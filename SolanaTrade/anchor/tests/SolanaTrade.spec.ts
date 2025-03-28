import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { SolanaTrade } from '../target/types/SolanaTrade'

describe('SolanaTrade', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.SolanaTrade as Program<SolanaTrade>

  const SolanaTradeKeypair = Keypair.generate()

  it('Initialize SolanaTrade', async () => {
    await program.methods
      .initialize()
      .accounts({
        SolanaTrade: SolanaTradeKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([SolanaTradeKeypair])
      .rpc()

    const currentCount = await program.account.SolanaTrade.fetch(SolanaTradeKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment SolanaTrade', async () => {
    await program.methods.increment().accounts({ SolanaTrade: SolanaTradeKeypair.publicKey }).rpc()

    const currentCount = await program.account.SolanaTrade.fetch(SolanaTradeKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment SolanaTrade Again', async () => {
    await program.methods.increment().accounts({ SolanaTrade: SolanaTradeKeypair.publicKey }).rpc()

    const currentCount = await program.account.SolanaTrade.fetch(SolanaTradeKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement SolanaTrade', async () => {
    await program.methods.decrement().accounts({ SolanaTrade: SolanaTradeKeypair.publicKey }).rpc()

    const currentCount = await program.account.SolanaTrade.fetch(SolanaTradeKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set SolanaTrade value', async () => {
    await program.methods.set(42).accounts({ SolanaTrade: SolanaTradeKeypair.publicKey }).rpc()

    const currentCount = await program.account.SolanaTrade.fetch(SolanaTradeKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the SolanaTrade account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        SolanaTrade: SolanaTradeKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.SolanaTrade.fetchNullable(SolanaTradeKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
