use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Name must be less than 32 characters")]
    NameTooLong,
    
    #[msg("Symbol must be less than 12 characters")]
    SymbolTooLong,
    
    #[msg("Total supply must be greater than 0")]
    InvalidSupply,
    
    #[msg("Price must be greater than 0")]
    InvalidPrice,
    
    #[msg("Insufficient stock balance")]
    InsufficientStockBalance,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    #[msg("Offer not active")]
    OfferNotActive,
    
    #[msg("Not authorized")]
    NotAuthorized,
} 