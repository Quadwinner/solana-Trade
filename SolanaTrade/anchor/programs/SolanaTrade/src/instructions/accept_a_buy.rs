use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AcceptBuyOffer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(_ctx: Context<AcceptBuyOffer>) -> Result<()> {
    Ok(())
} 