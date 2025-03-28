use anchor_lang::prelude::*;
use crate::state::Stock;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(name: String, symbol: String, total_supply: u64, current_price: u64)]
pub struct CreateStock<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Stock::INIT_SPACE,
        seeds = [
            b"stock".as_ref(),
            authority.key().as_ref(),
            symbol.as_bytes(),
        ],
        bump
    )]
    pub stock: Account<'info, Stock>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateStock>,
    name: String,
    symbol: String,
    total_supply: u64,
    current_price: u64,
) -> Result<()> {
    require!(name.len() <= 32, ErrorCode::NameTooLong);
    require!(symbol.len() <= 12, ErrorCode::SymbolTooLong);
    require!(total_supply > 0, ErrorCode::InvalidSupply);
    require!(current_price > 0, ErrorCode::InvalidPrice);
    
    let stock = &mut ctx.accounts.stock;
    stock.name = name;
    stock.symbol = symbol;
    stock.total_supply = total_supply;
    stock.available_supply = total_supply;
    stock.current_price = current_price;
    stock.authority = ctx.accounts.authority.key();
    
    Ok(())
} 