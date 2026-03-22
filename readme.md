# DonateChain — EVM & Rootstock Portfolio Project

**DonateChain** is a decentralized, on-chain donation platform built to showcase production-ready Web3 development capabilities, EVM optimization, and low-level dApp integration principles.

This project was intentionally engineered as a **portfolio centerpiece for blockchain engineering roles**, demonstrating a deep understanding of Solidity security patterns, manual EVM ABI encoding, EIP-6963 wallet discovery, and Web2/Web3 convergence.

---

## 📖 Project Overview

### What it Does
DonateChain establishes a trustless bridge for micro-transactions between users and verified non-profits on the RSK (Rootstock) Testnet. Because every transaction is recorded on a Bitcoin-secured ledger via merged-mining, contributors possess immutable proof of their donations.

Key features include:
- **On-Chain User Registry**: A customized `UserRegistry` smart contract enforces strict O(1) two-way mappings for username resolution.
- **Escrow & Organization Discovery**: A `DonationManager` smart contract accurately tracks organizational volume and strictly guards payout withdrawals against reentrancy.
- **Low-Level UI Integration**: A lightning-fast React frontend that completely avoids heavy Web3 SDK-bloat by utilizing raw JSON-RPC requests and handwritten ABI encoders.

### The Technical Stack
1. **Frontend**: React, Vite, TailwindCSS, Radix-UI.
2. **Authentication (Web2)**: Supabase for traditional administrative RBAC and organizational profile management.
3. **Web3 Layer (Web3)**: Direct EVM interaction via EIP-1193 and EIP-6963 discovery (`ethersProvider.js`).
4. **Smart Contracts**: Hardhat-compiled Solidity (`v0.8.20`) deployed directly to the RSK Testnet.

---

## 🛠 Setup & Installation

Follow these steps to run **DonateChain** locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or newer)
- A [Supabase](https://supabase.com/) project
- [MetaMask](https://metamask.io/) or any compatible Web3 wallet installed in your browser

### 1. Install Dependencies
Clone the repository and install the standard NPM packages.
```bash
npm install
```

### 2. Configure Environment Variables
You must connect the application to your Supabase backend. Copy the example `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Inside `.env.local`, fill out the properties with the keys from your Supabase project settings:
```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app will immediately hot-reload to reflect any changes you make in the `./src` folder.

### 4. Build for Production
When you're ready to deploy (e.g., to Vercel, Netlify, or AWS), bundle the application:
```bash
npm run build
```
This compiles a stripped, optimized artifact in the `./dist` folder. You can preview the production build locally via:
```bash
npm run preview
```

---

## 🐛 Troubleshooting

- **MetaMask Not Connecting**: The wallet detection logic has been upgraded to support EIP-1193 standard wallets natively. Ensure you have the MetaMask extension active. If you use multiple wallets, the system will now default to the highest priority injected provider instead of abruptly failing.
- **Port In Use (Vite)**: If `npm run dev` starts silently on a different port (e.g., `:5174`), you can forcibly specify `npm run dev -- --port 5173`.

---
*Powered by React, Supabase, and RSK.*
