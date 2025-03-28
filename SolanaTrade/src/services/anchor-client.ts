import * as anchor from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Import wallet configuration
import { connectionConfig } from '../components/trading/wallet-config';

// Define constant program ID
const PROGRAM_ID = new PublicKey("GMHg1cPTLBxzxnFYu9TXhxt9n9kujbeT8nzfvj7jPpQg");

// Basic BN type for numeric values
export type BN = anchor.BN;

// Type definitions for our program accounts and instructions
export interface Stock {
  name: string;
  symbol: string;
  totalSupply: BN;
  availableSupply: BN;
  currentPrice: BN;
  authority: PublicKey;
}

export interface StockPosition {
  owner: PublicKey;
  stock: PublicKey;
  amount: BN;
  entryPrice: BN;
}

export interface Offer {
  isBuy: boolean;
  maker: PublicKey;
  stock: PublicKey;
  amount: BN;
  price: BN;
  isActive: boolean;
}

export class AnchorClient {
  private connection: Connection;
  private wallet: AnchorWallet;
  private provider: anchor.Provider;
  private initialized: boolean = false;

  constructor(connection: Connection, wallet: AnchorWallet) {
    try {
      console.log("Starting AnchorClient initialization");
      console.log("Connection endpoint:", connection.rpcEndpoint);
      console.log("Wallet public key:", wallet.publicKey.toString());
      
      // Set up connection and wallet
      this.connection = new Connection(
        connection.rpcEndpoint, 
        {
          commitment: connectionConfig.commitment,
          confirmTransactionInitialTimeout: connectionConfig.confirmTransactionInitialTimeout,
          disableRetryOnRateLimit: connectionConfig.disableRetryOnRateLimit,
          httpHeaders: connectionConfig.httpHeaders
        }
      );
      this.wallet = wallet;

      // Create provider
      this.provider = new anchor.AnchorProvider(
        this.connection, 
        wallet, 
        { 
          commitment: connectionConfig.commitment,
          preflightCommitment: connectionConfig.commitment,
          skipPreflight: false,
        }
      );
      
      console.log("AnchorClient initialized successfully");
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing AnchorClient:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      this.initialized = false;
      throw error;
    }
  }

  // Check if the client is ready
  isReady(): boolean {
    return this.initialized;
  }

  // Helper method to find a PDA for stock account
  async findStockPDA(symbol: string): Promise<[PublicKey, number]> {
    try {
      return await PublicKey.findProgramAddressSync(
        [
          Buffer.from('stock'), 
          this.wallet.publicKey.toBuffer(), 
          Buffer.from(symbol)
        ],
        PROGRAM_ID
      );
    } catch (error) {
      console.error("Error finding stock PDA:", error);
      throw error;
    }
  }

  // Helper method to find a PDA for stock position account
  async findStockPositionPDA(owner: PublicKey, stockPubkey: PublicKey): Promise<[PublicKey, number]> {
    try {
      return await PublicKey.findProgramAddressSync(
        [
          Buffer.from('position'), 
          owner.toBuffer(), 
          stockPubkey.toBuffer()
        ],
        PROGRAM_ID
      );
    } catch (error) {
      console.error("Error finding stock position PDA:", error);
      throw error;
    }
  }

  // Helper method to find a PDA for offer account
  async findOfferPDA(maker: PublicKey, stockPubkey: PublicKey, amount: BN, price: BN): Promise<[PublicKey, number]> {
    try {
      return await PublicKey.findProgramAddressSync(
        [
          Buffer.from('offer'), 
          maker.toBuffer(), 
          stockPubkey.toBuffer(), 
          new Uint8Array(amount.toArrayLike(Buffer, 'le', 8)),
          new Uint8Array(price.toArrayLike(Buffer, 'le', 8))
        ],
        PROGRAM_ID
      );
    } catch (error) {
      console.error("Error finding offer PDA:", error);
      throw error;
    }
  }

  // Get a stock account
  async getStock(stockPubkey: PublicKey): Promise<Stock | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(stockPubkey);
      if (!accountInfo) {
        return null;
      }
      
      // In a real implementation, you would deserialize the account data
      // This is a placeholder
      return {
        name: "Sample Stock",
        symbol: "SMPL",
        totalSupply: new anchor.BN(1000000),
        availableSupply: new anchor.BN(1000000),
        currentPrice: new anchor.BN(100),
        authority: this.wallet.publicKey,
      };
    } catch (error) {
      console.error("Error getting stock:", error);
      return null;
    }
  }

  // Create a new stock - simplified implementation without using Anchor Program
  async createStock(name: string, symbol: string, totalSupply: number, price: number): Promise<string> {
    try {
      console.log(`Creating stock: ${name} (${symbol}) with ${totalSupply} shares at ${price} price`);
      
      // In a real implementation, you would build and send a transaction
      // This is a placeholder that returns a fake transaction signature
      return "Transaction12345";
    } catch (error) {
      console.error('Error creating stock:', error);
      throw error;
    }
  }

  // Create an offer to sell stock - simplified implementation
  async createOffer(stockPubkey: PublicKey, amount: number, price: number): Promise<string> {
    try {
      console.log(`Creating offer to sell ${amount} shares at ${price} price`);
      
      // In a real implementation, you would build and send a transaction
      // This is a placeholder that returns a fake transaction signature
      return "Transaction67890";
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }
  
  // Accept a buy offer - simplified implementation
  async acceptBuyOffer(offerPubkey: PublicKey, stockPubkey: PublicKey, maker: PublicKey): Promise<string> {
    try {
      console.log(`Accepting buy offer: ${offerPubkey.toString()} for stock ${stockPubkey.toString()} by maker ${maker.toString()}`);
      
      // In a real implementation, you would build and send a transaction
      // This is a placeholder that returns a fake transaction signature
      return "Transaction67890";
    } catch (error) {
      console.error('Error accepting buy offer:', error);
      throw error;
    }
  }
  
  // Get all active offers - simplified implementation
  async getActiveOffers(): Promise<{ publicKey: PublicKey, account: Offer }[]> {
    try {
      console.log('Getting active offers');
      
      // In a real implementation, you would fetch real data from the blockchain
      // This is a placeholder that returns dummy data
      return [
        {
          publicKey: new PublicKey('11111111111111111111111111111111'),
          account: {
            isBuy: false, // It's a sell offer
            maker: new PublicKey('11111111111111111111111111111111'),
            stock: new PublicKey('22222222222222222222222222222222'),
            amount: new anchor.BN(10),
            price: new anchor.BN(100 * 1e9), // 100 SOL in lamports
            isActive: true
          }
        },
        {
          publicKey: new PublicKey('33333333333333333333333333333333'),
          account: {
            isBuy: false,
            maker: new PublicKey('44444444444444444444444444444444'),
            stock: new PublicKey('55555555555555555555555555555555'),
            amount: new anchor.BN(5),
            price: new anchor.BN(200 * 1e9), // 200 SOL in lamports
            isActive: true
          }
        }
      ];
    } catch (error) {
      console.error('Error getting active offers:', error);
      return [];
    }
  }
  
  // Get all stocks - simplified implementation
  async getAllStocks(): Promise<{ publicKey: PublicKey, account: Stock }[]> {
    try {
      console.log('Getting all stocks');
      
      // In a real implementation, you would fetch real data from the blockchain
      // This is a placeholder that returns dummy data
      return [
        {
          publicKey: new PublicKey('22222222222222222222222222222222'),
          account: {
            name: "Solana Labs",
            symbol: "SOL",
            totalSupply: new anchor.BN(1000000),
            availableSupply: new anchor.BN(800000),
            currentPrice: new anchor.BN(100 * 1e9), // 100 SOL in lamports
            authority: new PublicKey('11111111111111111111111111111111')
          }
        },
        {
          publicKey: new PublicKey('55555555555555555555555555555555'),
          account: {
            name: "Ethereum",
            symbol: "ETH",
            totalSupply: new anchor.BN(500000),
            availableSupply: new anchor.BN(450000),
            currentPrice: new anchor.BN(200 * 1e9), // 200 SOL in lamports
            authority: new PublicKey('44444444444444444444444444444444')
          }
        }
      ];
    } catch (error) {
      console.error('Error getting all stocks:', error);
      return [];
    }
  }
} 