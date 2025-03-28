import { Idl } from '@coral-xyz/anchor';
import rawIdl from '../../anchor/target/idl/solanatrade.json';

// Create a properly formatted IDL that includes the account types in the expected format
const idl: Idl = {
  // Base properties
  version: "0.1.0",
  name: "solanatrade",
  
  // Format instructions with proper snake_case
  instructions: [
    {
      name: "create_stock",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "stock", isMut: true, isSigner: false },
        { name: "system_program", isMut: false, isSigner: false }
      ],
      args: [
        { name: "name", type: "string" },
        { name: "symbol", type: "string" },
        { name: "total_supply", type: "u64" },
        { name: "current_price", type: "u64" }
      ]
    },
    {
      name: "create_offer",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "system_program", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "price", type: "u64" }
      ]
    },
    {
      name: "accept_buy_offer",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "system_program", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  
  // Include accounts with proper field types
  accounts: [
    {
      name: "Stock",
      type: {
        kind: "struct",
        fields: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "totalSupply", type: "u64" },
          { name: "availableSupply", type: "u64" },
          { name: "currentPrice", type: "u64" },
          { name: "authority", type: "publicKey" }
        ]
      }
    }
  ],
  
  // Include errors
  errors: [
    { code: 6000, name: "NameTooLong", msg: "Name must be less than 32 characters" },
    { code: 6001, name: "SymbolTooLong", msg: "Symbol must be less than 12 characters" },
    { code: 6002, name: "InvalidSupply", msg: "Total supply must be greater than 0" },
    { code: 6003, name: "InvalidPrice", msg: "Price must be greater than 0" },
    { code: 6004, name: "InsufficientStockBalance", msg: "Insufficient stock balance" },
    { code: 6005, name: "InsufficientFunds", msg: "Insufficient funds" },
    { code: 6006, name: "OfferNotActive", msg: "Offer not active" },
    { code: 6007, name: "NotAuthorized", msg: "Not authorized" }
  ]
};

export default idl; 