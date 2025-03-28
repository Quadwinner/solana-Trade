import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, Commitment } from "@solana/web3.js";

// Configure the connection to use HTTP instead of WebSocket
export const network = WalletAdapterNetwork.Devnet;

// Create a connection configuration that doesn't use WebSockets
export const connectionConfig = {
  commitment: "processed" as Commitment,
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: true,
  httpHeaders: {
    "Content-Type": "application/json",
  }
};

// Standard RPC endpoint - force it to use HTTP and not WS
export const endpoint = clusterApiUrl(network);

// Create a connection that won't try to use WebSockets
export const connection = new Connection(endpoint, connectionConfig);

export default {
  network,
  endpoint,
  connection,
  connectionConfig
}; 