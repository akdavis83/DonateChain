# Testing & Verification Guide

This document provides instructions for external users and developers to verify the security and functionality of the CovenantPay Donation Protocol.

## 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

Clone the repository and install dependencies:

```bash
cd "New folder"
npm install
```

## 2. Running Automated Tests

We use **Hardhat** and **Chai** for our testing suite. The tests cover:
- **UserRegistry:** Identity management, uniqueness, and input validation.
- **DonationManager:** Financial routing, organization statistics, and event logging.
- **Integration:** Cross-contract data consistency.

Run the full suite:

```bash
npm test
```

## 3. Coverage Analysis

To ensure that every line of our smart contracts is verified, you can run the coverage report:

```bash
npm run coverage
```

This will generate a `coverage/` folder. Open `coverage/index.html` in your browser to see a detailed breakdown. **Our goal is 100% coverage for core financial logic.**

## 4. Manual Verification on RSK Testnet

If you wish to verify the contracts on a live network:

1.  **Configure Environment:** Create a `.env` file with your `PRIVATE_KEY`.
2.  **Deploy:**
    ```bash
    npm run deploy:testnet
    ```
3.  **Verify on Explorer:**
    Use the addresses provided in `addrs.txt` to view the contracts on the [RSK Testnet Explorer](https://explorer.testnet.rsk.co/).

## 5. Security Principles

- **Checks-Effects-Interactions:** Followed in `DonationManager.sol` to prevent reentrancy during fund forwarding.
- **Custom Errors:** Used instead of strings to save gas and provide precise failure reasons.
- **Immediate Forwarding:** Funds are never held by the `DonationManager` contract, minimizing the honeypot risk.

---

**CovenantPay Protocol - Transparency through Code.**
