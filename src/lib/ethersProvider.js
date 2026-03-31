// Lightweight ethers-like provider using window.ethereum (MetaMask)
// This avoids importing ethers.js since it's not in the installed packages.
// We use raw JSON-RPC calls and ABI encoding/decoding helpers.

import { NETWORK_CONFIG } from "./contracts";

// RSK Testnet RPC URL (for direct queries that MetaMask doesn't support)
export const RSK_TESTNET_RPC = "https://public-node.testnet.rsk.co";

// Blockscout API for RSK Testnet (supports eth_getLogs)
export const BLOCKSCOUT_API = "https://rootstock-testnet.blockscout.com/api";

// Helper to get window.ethereum with TypeScript ignore
function getEthereum() {
  // @ts-ignore
  return window.ethereum;
}

// Modern EIP-6963 Provider Discovery
let eip6963Providers = [];
if (typeof window !== "undefined") {
  // @ts-ignore
  window.addEventListener("eip6963:announceProvider", (event) => {
    // @ts-ignore
    if (event.detail && event.detail.info && event.detail.provider) {
      eip6963Providers.push(event.detail);
    }
  });
  // @ts-ignore
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

// Detect MetaMask specifically (bypasses Trust Wallet hijacking using EIP-6963)
function getMetaMask() {
  // 1. Try EIP-6963 (The modern conflict-free way)
  const mmEIP = eip6963Providers.find(p => p.info.rdns === "io.metamask.wallet" || p.info.name === "MetaMask");
  if (mmEIP) return mmEIP.provider;

  // 2. Legacy fallback
  const ethereum = window['ethereum'];
  if (!ethereum) return null;

  if (ethereum.providers && Array.isArray(ethereum.providers)) {
    const mm = ethereum.providers.find((p) => p['isMetaMask'] && !p['isTrustWallet'] && !p['isBraveWallet'] && !p['isCoinbaseWallet']);
    if (mm) return mm;
  }

  if (ethereum['isMetaMask'] && !ethereum['isTrustWallet'] && !ethereum['isBraveWallet'] && !ethereum['isCoinbaseWallet']) {
    return ethereum;
  }

  return null;
}

// Any injected provider (fallback)
function getAnyProvider() {
  if (eip6963Providers.length > 0) {
    return eip6963Providers[0].provider;
  }

  if (!window.ethereum) return null;
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    return window.ethereum.providers[0] || null;
  }
  return window.ethereum;
}

// Use MetaMask if available, otherwise fallback
function provider() {
  const p = getMetaMask() || getAnyProvider();
  if (!p) throw new Error("No wallet detected");
  return p;
}

export function getMetaMaskProvider() {
  return getMetaMask();
}

export function hasMetaMask() {
  return !!getMetaMask();
}

export function hasAnyWallet() {
  return !!window.ethereum;
}

export function getActiveProvider() {
  return getMetaMask() || getAnyProvider();
}

// ============================================================
// Provider helpers
// ============================================================

export async function requestAccounts() {
  const accounts = await provider().request({ method: "eth_requestAccounts" });
  return accounts;
}

export async function getChainId() {
  const chainId = await provider().request({ method: "eth_chainId" });
  return parseInt(chainId, 16);
}

export async function switchToRskTestnet() {
  try {
    await provider().request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK_CONFIG.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await provider().request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: NETWORK_CONFIG.chainId,
            chainName: NETWORK_CONFIG.chainName,
            rpcUrls: NETWORK_CONFIG.rpcUrls,
            blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
            nativeCurrency: NETWORK_CONFIG.nativeCurrency,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export async function getBalance(address) {
  const balance = await provider().request({
    method: "eth_getBalance",
    params: [address, "latest"],
  });
  return BigInt(balance);}

// ============================================================
// ABI Encoding / Decoding helpers (minimal, no external deps)
// ============================================================

function padLeft(hex, bytes = 32) {
  return hex.padStart(bytes * 2, "0");
}

function encodeUint256(value) {
  return padLeft(BigInt(value).toString(16));
}

function encodeAddress(addr) {
  return padLeft(addr.toLowerCase().replace("0x", ""));
}

function encodeBool(val) {
  return encodeUint256(val ? 1 : 0);
}

function encodeString(str) {
  const hex = Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const len = encodeUint256(str.length);
  const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64, "0");
  return len + padded;
}

function encodeDynamicBytes(offset) {
  return encodeUint256(offset);
}

function keccak256Selector(sig) {
  // We'll compute the function selector. Since we don't have keccak256,
  // we pre-compute known selectors.
  const selectors = {
    // UserRegistry
    "registerUsername(string)": "36a94134",
    "getUsername(address)": "ce43c032",
    "isUsernameTaken(string)": "176c5919",
    "getAddressByUsername(string)": "6322961d",
    "hasUsername(address)": "a5c2fb82",
    // DonationManager
    "donate(address,bool)": "7be4bae1",
    "withdraw()": "3ccfd60b",
    "donationCount()": "2abfab4d",
    "donations(uint256)": "f8626af8",
    "getOrgStats(address)": "e3f1e29d",
    "getDonation(uint256)": "ef07a81f",
    "hasOrgDonations(address)": "cda88740",
    "orgBalances(address)": "d8c4ec83",
    "orgStats(address)": "a2bd8f1a",
    "userRegistry()": "5c7460d6",
  };
  return selectors[sig] || null;
}

// ============================================================
// Contract interaction
// ============================================================

export function getFunctionSelector(functionSig) {
  const sel = keccak256Selector(functionSig);
  if (!sel) throw new Error(`Unknown function selector for: ${functionSig}`);
  return "0x" + sel;
}

export async function callContract(contractAddress, functionSig, params = [], valueWei = null) {
  const selector = getFunctionSelector(functionSig);
  let data = selector;

  // For functions with dynamic params, we need proper ABI encoding
  // Simple static params first
  const staticParts = [];
  const dynamicParts = [];
  let dynamicOffset = params.length * 32;

  for (const p of params) {
    if (p.type === "address") {
      staticParts.push(encodeAddress(p.value));
    } else if (p.type === "uint256") {
      staticParts.push(encodeUint256(p.value));
    } else if (p.type === "bool") {
      staticParts.push(encodeBool(p.value));
    } else if (p.type === "string") {
      staticParts.push(encodeDynamicBytes(dynamicOffset));
      const encoded = encodeString(p.value);
      dynamicParts.push(encoded);
      dynamicOffset += encoded.length / 2;
    }
  }

  data += staticParts.join("") + dynamicParts.join("");

  const txParams = {
    to: contractAddress,
    data,
  };

  if (valueWei) {
    txParams.value = "0x" + BigInt(valueWei).toString(16);
  }

  return txParams;
}

export async function ethCall(txParams) {
  const result = await provider().request({
    method: "eth_call",
    params: [txParams, "latest"],
  });
  return result;
}

export async function ethSendTransaction(txParams, from) {
  const result = await provider().request({
    method: "eth_sendTransaction",
    params: [{ ...txParams, from }],
  });
  return result; // tx hash
}

// ============================================================
// Decode helpers
// ============================================================

export function decodeUint256(hex) {
  if (!hex || hex === "0x") return 0n;
  const clean = hex.replace("0x", "");
  return BigInt("0x" + clean.slice(0, 64));
}

export function decodeMultipleUint256(hex, count) {
  const clean = hex.replace("0x", "");
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(BigInt("0x" + clean.slice(i * 64, (i + 1) * 64)));
  }
  return results;
}

export function decodeString(hex) {
  const clean = hex.replace("0x", "");
  if (clean.length < 128) return "";
  // offset is first 32 bytes
  const offset = parseInt(clean.slice(0, 64), 16) * 2;
  const length = parseInt(clean.slice(offset, offset + 64), 16);
  const strHex = clean.slice(offset + 64, offset + 64 + length * 2);
  const bytes = [];
  for (let i = 0; i < strHex.length; i += 2) {
    bytes.push(parseInt(strHex.slice(i, i + 2), 16));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function decodeBool(hex) {
  const clean = hex.replace("0x", "");
  return BigInt("0x" + clean.slice(0, 64)) !== 0n;
}

export function decodeAddress(hex) {
  const clean = hex.replace("0x", "");
  return "0x" + clean.slice(24, 64);
}

// ============================================================
// Event log parsing
// ============================================================

export async function getLogs(contractAddress, eventTopic, fromBlock = "0x0") {
  try {
    console.log("getLogs called with:", { contractAddress, eventTopic, fromBlock });
    
    // Convert hex block numbers to decimal for Blockscout API
    const fromBlockDecimal = parseInt(fromBlock, 16);
    const toBlockDecimal = "latest"; // We can use "latest" to get logs up to the most recent block
    
    // Use Blockscout API instead of RPC (RSK RPC doesn't support eth_getLogs)
    const response = await fetch(`${BLOCKSCOUT_API}?module=logs&action=getLogs&address=${contractAddress}&topic0=${eventTopic}&fromBlock=${fromBlockDecimal}&toBlock=${toBlockDecimal}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.status !== "1" || !data.result) {
      throw new Error(`Blockscout API error: ${data.message}`);
    }
    
    const logs = data.result || [];
    
    console.log("getLogs result:", logs.length, "logs found");
    return logs.map(log => ({
      topics: log.topics,
      data: log.data,
      blockNumber: log.blockNumber,
      transactionHash: log.hash,
      address: log.address,
    }));
  } catch (err) {
    console.error("getLogs error:", err);
    throw err;
  }
}

// DonationMade event topic (keccak256 of the event signature)
// event DonationMade(uint256 indexed id, address indexed donor, address indexed organization, uint256 amount, bool isAnonymous, uint256 timestamp)
// We pre-compute this
export const DONATION_MADE_TOPIC = "0xbad61217da3f32a7d23f0c6f395950f4cf02002f1e010bff3f6fa460ef6c8139";

export function parseDonationMadeLog(log) {
  // topics[0] = event sig
  // topics[1] = indexed id (uint256)
  // topics[2] = indexed donor (address)
  // topics[3] = indexed organization (address)
  // data = amount (uint256) + anonymous (bool) + timestamp (uint256)
  const id = BigInt(log.topics[1]);
  const donor = "0x" + log.topics[2].slice(26);
  const organization = "0x" + log.topics[3].slice(26);

  const dataClean = log.data.replace("0x", "");
  const amount = BigInt("0x" + dataClean.slice(0, 64));
  const anonymous = BigInt("0x" + dataClean.slice(64, 128)) !== 0n;
  const timestamp = BigInt("0x" + dataClean.slice(128, 192));

  return {
    id: Number(id),
    donor,
    organization,
    amount,
    anonymous,
    timestamp: Number(timestamp),
    txHash: log.transactionHash,
    blockNumber: parseInt(log.blockNumber, 16),
  };
}

// ============================================================
// Wei formatting
// ============================================================

export function formatWei(wei, decimals = 6) {
  const bigWei = BigInt(wei);
  const wholePart = bigWei / 10n ** 18n;
  const fractionalPart = bigWei % 10n ** 18n;
  const fractStr = fractionalPart.toString().padStart(18, "0").slice(0, decimals);
  if (decimals === 0) return wholePart.toString();
  return `${wholePart}.${fractStr}`.replace(/\.?0+$/, "") || "0";
}

export function parseEther(eth) {
  const parts = eth.split(".");
  const whole = parts[0] || "0";
  const frac = (parts[1] || "").padEnd(18, "0").slice(0, 18);
  return BigInt(whole) * 10n ** 18n + BigInt(frac);
}

// ============================================================
// Tx receipt polling
// ============================================================

export async function waitForReceipt(txHash, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await provider().request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });
    if (receipt) return receipt;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction receipt timeout");
}

export function getTxExplorerUrl(txHash) {
  return `${NETWORK_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
}

export function getAddressExplorerUrl(address) {
  return `${NETWORK_CONFIG.blockExplorerUrls[0]}/address/${address}`;
}
