#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod error;

use instructions::create_stock::*;
use instructions::create_offer::*;
use instructions::accept_a_buy::*;

declare_id!("GMHg1cPTLBxzxnFYu9TXhxt9n9kujbeT8nzfvj7jPpQg");

#[program]
pub mod decentralized_stock_exchange {
    use super::*;

    pub fn create_stock(
        ctx: Context<CreateStock>,
        name: String,
        symbol: String,
        total_supply: u64,
        current_price: u64,
    ) -> Result<()> {
        instructions::create_stock::handler(ctx, name, symbol, total_supply, current_price)
    }

    pub fn create_offer(
        ctx: Context<CreateOffer>,
        amount: u64,
        price: u64,
    ) -> Result<()> {
        instructions::create_offer::handler(ctx, amount, price)
    }

    pub fn accept_buy_offer(ctx: Context<AcceptBuyOffer>) -> Result<()> {
        instructions::accept_a_buy::handler(ctx)
    }
}

#[derive(Accounts)]
pub struct InitializeSolanaTrade<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + SolanaTrade::INIT_SPACE,
  payer = payer
  )]
  pub SolanaTrade: Account<'info, SolanaTrade>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseSolanaTrade<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub SolanaTrade: Account<'info, SolanaTrade>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub SolanaTrade: Account<'info, SolanaTrade>,
}

#[account]
#[derive(InitSpace)]
pub struct SolanaTrade {
  count: u8,
}
