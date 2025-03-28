use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Stock {
    #[max_len(32)]
    pub name: String,            // 32 bytes max
    #[max_len(12)]
    pub symbol: String,          // 12 bytes max
    pub total_supply: u64,       // 8 bytes
    pub available_supply: u64,   // 8 bytes
    pub current_price: u64,      // 8 bytes
    pub authority: Pubkey,       // 32 bytes (stock creator)
}

#[account]
#[derive(InitSpace)]
pub struct StockPosition {
    pub owner: Pubkey,           // 32 bytes
    pub stock: Pubkey,           // 32 bytes (stock account pubkey)
    pub amount: u64,             // 8 bytes
    pub entry_price: u64,        // 8 bytes (average entry price)
}

#[account]
#[derive(InitSpace)]
pub struct Offer {
    pub is_buy: bool,            // 1 byte (true = buy offer, false = sell offer)
    pub maker: Pubkey,           // 32 bytes (offer creator)
    pub stock: Pubkey,           // 32 bytes (stock account pubkey)
    pub amount: u64,             // 8 bytes
    pub price: u64,              // 8 bytes
    pub is_active: bool,         // 1 byte
}

// Market statistics for tracking and analytics
#[account]
#[derive(InitSpace)]
pub struct MarketStats {
    pub total_stocks: u64,        // 8 bytes
    pub total_volume_24h: u64,    // 8 bytes
    pub total_transactions: u64,  // 8 bytes
    pub highest_valued_stock: Pubkey, // 32 bytes
    pub most_traded_stock: Pubkey,    // 32 bytes
} 