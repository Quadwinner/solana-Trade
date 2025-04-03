# SolanaTrade - Decentralized Stock Exchange

A blockchain-based decentralized exchange for trading stocks on the Solana network.

## Project Idea & Vision

SolanaTrade aims to revolutionize traditional stock trading by leveraging Solana's high-performance blockchain. This project brings the benefits of decentralization to stock trading:

- **Transparency**: All transactions are recorded on the blockchain, providing complete transparency
- **Trustless Trading**: No central authority controls the exchange; trades are executed via smart contracts
- **Reduced Fees**: Eliminate intermediary costs associated with traditional exchanges
- **Global Access**: Anyone with a Solana wallet can participate in trading regardless of location
- **24/7 Availability**: Trading can occur at any time without market hour restrictions

The platform bridges the gap between traditional financial markets and blockchain technology, enabling the tokenization of stocks and securities for a more accessible, efficient trading experience.

## Implementation Details

### Smart Contract Architecture

The Solana program is built using the Anchor framework and implements several key components:

- **Stock Management**: Create new stock assets with customizable parameters
- **Offer System**: A double auction mechanism for buy/sell offers
- **Order Matching**: Smart contract logic for matching compatible trading orders
- **Settlement System**: Atomically execute trades by transferring assets between parties

### Key Data Structures
- `Stock`: Represents a stock with properties for name, symbol, supply, and price
- `Offer`: Encapsulates buy/sell offers with amount, price, and owner information
- `TradeRecord`: Maintains a history of executed trades

### Frontend Implementation
- React-based single-page application with wallet integration
- Real-time updates using React Query for data fetching and caching
- Responsive design with Tailwind CSS and DaisyUI components
- Trading interface with order book visualization
- Account management and portfolio tracking

## Overview

SolanaTrade is a full-stack application that combines a Solana smart contract (built with Anchor) and a modern React frontend to create a decentralized stock exchange. The platform allows users to create stocks, make buy/sell offers, and execute trades in a trustless environment.

## Features

- Create stock assets with custom name, symbol, supply, and price
- Create buy/sell offers for stocks
- Accept and execute trade offers
- Wallet integration for Solana transactions
- Modern, responsive UI built with React, Tailwind CSS, and DaisyUI

## Project Structure

```
SolanaTrade/
├── anchor/               # Solana smart contract (Anchor framework)
│   ├── programs/         # Contract program code
│   │   └── SolanaTrade/  # Main program implementation
│   ├── tests/            # Contract test cases
│   └── Anchor.toml       # Anchor configuration
├── src/                  # Frontend application
│   ├── app/              # Main application components
│   ├── components/       # Reusable UI components
│   │   ├── account/      # Account management
│   │   ├── auth/         # Authentication
│   │   ├── cluster/      # Solana cluster selection
│   │   ├── dashboard/    # Dashboard views
│   │   ├── solana/       # Solana integration
│   │   ├── SolanaTrade/  # Program-specific components
│   │   ├── trading/      # Trading interface components
│   │   └── ui/           # Generic UI components
│   ├── contexts/         # React context providers
│   ├── services/         # API and service layer
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## Technologies

### Blockchain
- Solana Blockchain
- Anchor Framework
- Solana Web3.js

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- DaisyUI
- React Router
- React Query
- Wallet Adapter

## Getting Started

### Prerequisites

- Node.js (v16+)
- Rust
- Solana CLI
- Anchor CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SolanaTrade.git
cd SolanaTrade
```

2. Install dependencies:
```bash
npm install
```

3. Install Anchor dependencies:
```bash
cd anchor
npm install
```

### Local Development

1. Start a local Solana validator:
```bash
npm run anchor-localnet
```

2. Build the Anchor program:
```bash
npm run anchor-build
```

3. Deploy the program locally:
```bash
cd anchor
anchor deploy
```

4. Start the frontend development server:
```bash
npm run dev
```

5. Open your browser and navigate to: `http://localhost:5173`

### Testing

Run Anchor tests:
```bash
npm run anchor-test
```

## Deployment

### Building for Production

Build the frontend for production:
```bash
npm run build
```

The optimized build will be available in the `dist` directory.

### Deploying the Program

To deploy to Solana devnet:
1. Update `Anchor.toml` to set the desired network
2. Run the deployment command:
```bash
cd anchor
anchor deploy --provider.cluster devnet
```

## License

This project is licensed under the terms specified in the LICENSE file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 