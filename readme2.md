# DonateChain — Comprehensive User Guide

## 🌐 Overview

DonateChain is a decentralized, on-chain donation platform built to showcase production-ready Web3 development capabilities, EVM optimization, and low-level dApp integration principles. This platform establishes a trustless bridge for micro-transactions between users and verified non-profits on the RSK (Rootstock) Testnet.

Because every transaction is recorded on a Bitcoin-secured ledger via merged-mining, contributors possess immutable proof of their donations, creating unprecedented transparency in charitable giving.

## 🎯 Core Purpose

DonateChain solves critical problems in the charitable sector:
- **Lack of Transparency**: Donors often have no visibility into how their funds are used
- **High Transaction Fees**: Traditional platforms take significant cuts from donations
- **Slow Processing**: Cross-border donations can take days to process
- **Trust Deficit**: Donors question whether organizations are legitimate

By leveraging blockchain technology, DonateChain provides:
- ✅ Immutable, verifiable donation records
- ✅ Near-instant, low-cost transactions
- ✅ Global accessibility without intermediaries
- ✅ Anonymous donation options for privacy-conscious users
- ✅ Real-time donation feeds for complete transparency

## 👥 Target Audience

### For Donors:
- Individuals who want to make transparent, traceable donations
- Privacy-conscious users who prefer anonymous giving
- Crypto enthusiasts looking to use their tRBTC for social good
- International donors seeking low-fee cross-border giving

### For Organizations:
- Registered non-profits seeking transparent funding streams
- Charities wanting to demonstrate fiscal responsibility to donors
- Organizations targeting crypto-savvy donor demographics
- NGOs needing efficient, low-overhead donation processing

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or newer)
- A web browser with MetaMask installed (Chrome, Firefox, Brave, or Edge)
- Connection to the RSK Testnet
- Some tRBTC (testnet Bitcoin) for transactions (obtainable from [RSK Faucet](https://faucet.rsk.co))

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd DonateChain
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Connect to RSK Testnet**
   - Open MetaMask
   - Click network dropdown → "Add Network"
   - Use these RSK Testnet details:
     - Network Name: RSK Testnet
     - New RPC URL: https://public-node.testnet.rsk.co
     - Chain ID: 31
     - Currency Symbol: tRBTC
     - Block Explorer URL: https://explorer.testnet.rootstock.io

5. **Fund Your Wallet**
   - Visit [RSK Faucet](https://faucet.rsk.co)
   - Enter your wallet address
   - Request tRBTC for testing

6. **Run the Application**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 💰 Using DonateChain

### Step 1: Connect Your Wallet
- Click "Connect Wallet" button
- Select MetaMask from the wallet options
- Approve the connection request
- Switch to RSK Testnet if prompted

### Step 2: Register a Username (Optional but Recommended)
- Navigate to the "Username Registration" section
- Enter your desired username (3-30 characters)
- Click "Register Username"
- Confirm the transaction in MetaMask
- Your username will now appear in donation feeds instead of your wallet address

### Step 3: Make a Donation
1. **Find an Organization**
   - Browse the Organizational Status Panel for verified NGOs
   - Copy the organization's wallet address
   - Or enter an address manually if you know a specific charity

2. **Enter Donation Details**
   - Paste the organization address in the "Organization Address" field
   - Enter amount in tRBTC (e.g., 0.001)
   - Toggle "Anonymous donation" if desired
   - Click "Donate"

3. **Confirm Transaction**
   - Review transaction details in MetaMask
   - Confirm the transaction
   - Wait for blockchain confirmation (typically 10-30 seconds on RSK)

4. **View Your Donation**
   - Check the Live Feed section for real-time updates
   - View transaction details on the block explorer
   - See your donation reflected in organizational statistics

### Step 4: Withdraw Funds (For Organizations)
*Note: This feature is primarily demonstrated for organizational accounts*
- Organizations can withdraw accumulated funds
- Withdrawals follow the Checks-Effects-Interactions pattern for security
- Funds are sent directly to the organization's wallet

## 🔍 Key Features Explained

### On-Chain User Registry
Rather than displaying complex wallet addresses, DonateChain maps them to human-readable usernames:
- **O(1) Lookup**: Constant-time address ↔ username resolution
- **Immutable Records**: Once set, usernames cannot be spoofed
- **Gas Efficient**: Optimized storage with dual-mapping approach
- **Update Capability**: Users can change usernames while preserving history

### Escrow-Free Donation Manager
Unlike traditional platforms that hold funds, DonateChain uses a direct transfer model:
- **Immediate Transfers**: Funds sent directly to organizations upon donation
- **Reentrancy Protection**: Strict Checks-Effects-Interactions implementation
- **Transparent Accounting**: Real-time organizational statistics
- **Event Logging**: Every donation triggers blockchain events for audit trails

### Low-Level Web3 Integration
DonateChain avoids bloated Web3 SDKs for superior performance:
- **Direct JSON-RPC**: Communicates directly with MetaMask
- **Manual ABI Encoding**: Hand-crafted transaction data construction
- **EIP-6963 Compatibility**: Proper wallet detection avoiding conflicts
- **Lightweight Bundle**: Reduced JavaScript footprint for faster loading

### Web2/Web3 Convergence
Combines blockchain security with traditional usability:
- **Supabase Backend**: Handles organizational profiles and admin functions
- **Email Verification**: Secure organization verification process
- **Role-Based Access**: Different permissions for donors vs org admins
- **Familiar UI**: Intuitive interface despite blockchain backbone

## 🛡️ Security Features

### Smart Contract Security
- **Reentrancy Guards**: Checks-Effects-Interactions pattern throughout
- **Input Validation**: Comprehensive parameter checking
- **Access Controls**: Restricted functions for authorized users only
- **Upgradeability**: Designed for future enhancements without data loss
- **Gas Optimization**: Efficient storage and computation patterns

### Frontend Security
- **Wallet Connection**: Secure MetaMask integration
- **Transaction Signing**: All actions require user approval
- **Input Sanitization**: Protection against XSS and injection attacks
- **Error Handling**: Graceful failure modes with user feedback

### Network Security
- **RSK Testnet**: Leverages Bitcoin's merge-mined security
- **Testnet Isolation**: No risk to mainnet funds during testing
- **Faucet Protection**: Rate-limited testnet token distribution
- **Explorer Transparency**: All transactions publicly verifiable

## 📱 Responsive Design

DonateChain works across devices:
- **Mobile Optimized**: Touch-friendly controls and layouts
- **Tablet Adaptive**: Responsive grids and components
- **Desktop Full-Featured**: Complete functionality on larger screens
- **Progressive Enhancement**: Core functions work without JavaScript

## 🌐 Supported Networks

Currently deployed on:
- **RSK Testnet**: Merge-mined Bitcoin sidechain with EVM compatibility
  - Chain ID: 31
  - Block Time: ~30 seconds
  - Gas Price: Significantly lower than Ethereum mainnet
  - Security: Bitcoin-level hashpower protection

Future mainnet deployment planned for:
- RSK Mainnet (when sufficient testnet validation complete)
- Potential EVM-compatible L2 solutions for reduced costs

## 💡 Use Cases

### Individual Giving
- Micro-donations to content creators
- Emergency disaster relief contributions
- Recurring small donations to favorite causes
- Anonymous giving for sensitive causes

### Corporate Philanthropy
- Employee matching programs with transparent tracking
- Cause-related marketing campaigns with verifiable impact
- Supplier diversity spending with audit trails
- ESG reporting with blockchain-verified donations

### Non-Profit Operations
- Building donor trust through radical transparency
- Reducing administrative overhead on transaction processing
- Expanding reach to crypto-native donor demographics
- Creating endowment funds with programmable distribution

### Disaster Relief
- Rapid fund deployment in crisis situations
- International aid without banking intermediaries
- Donor confidence in fund allocation during emergencies
- Audit-ready records for grant compliance and reporting

## ❓ Frequently Asked Questions

### General Questions

**Q: Is DonateChain safe to use?**
A: Yes. The platform undergoes rigorous security testing, uses established patterns like Checks-Effects-Interactions, and leverages the security of the RSK Bitcoin sidechain. All transactions require your explicit approval via MetaMask.

**Q: Do I need cryptocurrency experience?**
A: Basic familiarity with wallets and transactions is helpful, but the interface guides you through each step. We provide detailed tooltips and error messages to assist newcomers.

**Q: What happens if I send to the wrong address?**
A: Blockchain transactions are immutable. Always double-check addresses before confirming. We recommend starting with small test amounts.

**Q: Are donations tax-deductible?**
A: Tax treatment depends on your jurisdiction and the recipient organization's status. Consult with a tax professional regarding cryptocurrency donations.

### Technical Questions

**Q: Why RSK instead of Ethereum?**
A: RSK provides Bitcoin's security through merged mining while maintaining EVM compatibility. This gives us superior security guarantees with lower transaction costs than Ethereum mainnet.

**Q: Why not use a Web3 library like ethers.js?**
A: We intentionally avoid heavy libraries to demonstrate deep understanding of Ethereum fundamentals and to minimize frontend bundle size for optimal performance.

**Q: Can I see my transaction on a block explorer?**
A: Absolutely! Every transaction includes a link to view it on the RSK Testnet block explorer, showing complete details including gas used, confirmations, and more.

**Q: What if the organization address is incorrect?**
A: The frontend validates address format before submission. However, you're responsible for ensuring you have the correct address for your intended recipient.

### Feature Questions

**Q: Can I donate anonymously?**
A: Yes! Simply toggle the "Anonymous donation" switch. Your wallet address will not be associated with the donation in public feeds or explorer views.

**Q: How do I know an organization is legitimate?**
A: Organizations must complete verification through our Supabase backend, which includes email verification and manual review. Look for verified badges in the organizational panels.

**Q: Is there a minimum donation amount?**
A: Technically, you can donate any amount above zero. However, extremely small amounts may be consumed by transaction fees. We suggest a minimum of 0.0001 tRBTC for meaningful transactions.

**Q: How long do transactions take?**
A: RSK Testnet targets ~30 second block times. Most transactions confirm within 1-2 blocks (30-60 seconds), though network conditions can vary.

## 🔧 Troubleshooting

### Wallet Connection Issues
- **Problem**: MetaMask not detected
  - **Solution**: Ensure MetaMask extension is installed and unlocked. Try refreshing the page.
  
- **Problem**: Wrong network selected
  - **Solution**: The app will prompt you to switch to RSK Testnet. You can also manually add the network in MetaMask settings.
  
- **Problem**: Multiple wallet conflicts
  - **Solution**: Our EIP-6963 implementation properly isolates wallet providers. Disconnect other wallets if issues persist.

### Transaction Problems
- **Problem**: Transaction stuck or failing
  - **Solution**: Check gas prices and try again. Ensure you have sufficient tRBTC for both donation amount and gas fees.
  
- **Problem**: "Contract not deployed" error
  - **Solution**: Verify contract addresses in `src/lib/contracts.js` match deployed contracts. Update if necessary.
  
- **Problem**: Insufficient funds error
  - **Solution**: Visit the RSK Faucet to get more testnet tRBTC.

### Display Issues
- **Problem**: Username not updating
  - **Solution**: Wait for blockchain confirmation, then refresh the page. Username changes require a new block.
  
- **Problem**: Live feed not updating
  - **Solution**: Make a new donation or refresh the page to trigger updates. The feed refreshes on donation completion events.

## 📞 Support & Community

### Documentation

- Smart Contract Details: Review Solidity files in `New folder/`
- Frontend Implementation: Examine React components in `src/components/`

### Issue Reporting
Found a bug or have a suggestion? Please:
1. Check existing issues in the repository
2. Create a detailed issue report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Wallet and network information

### Contributing
We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request with clear description
5. Follow existing code style and conventions

## 📜 License

DonateChain is open source and available under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- **RSK Labs**: For providing the Rootstock platform combining Bitcoin security with EVM compatibility
- **Supabase**: For the excellent backend-as-a-service powering our Web2 features
- **WalletConnect Team**: For inspiring our wallet connection implementation
- **OpenZeppelin**: For security patterns that informed our contract design
- **The Ethereum Community**: For the foundational technology and best practices

---

*Last Updated: March 2026*
*Version: 1.0.0*
*Built with ❤️ for transparent philanthropy*
