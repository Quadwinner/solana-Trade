use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateOffer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(_ctx: Context<CreateOffer>, _amount: u64, _price: u64) -> Result<()> {
    Ok(())
} 