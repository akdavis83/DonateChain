// Lightweight ethers-like provider using window.ethereum (MetaMask)
// This avoids importing ethers.js since it's not in the installed packages.
// We use raw JSON-RPC calls and ABI encoding/decoding helpers.

import { NETWORK_CONFIG } from "./contracts";

// Modern EIP-6963 Provider Discovery
let eip6963Providers = [];
if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event) => {
    if (event.detail && event.detail.info && event.detail.provider) {
      eip6963Providers.push(event.detail);
    }
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

// Detect MetaMask specifically (bypasses Trust Wallet hijacking using EIP-6963)
function getMetaMask() {
  // 1. Try EIP-6963 (The modern conflict-free way)
  const mmEIP = eip6963Providers.find(p => p.info.rdns === "io.metamask.wallet" || p.info.name === "MetaMask");
  if (mmEIP) return mmEIP.provider;

  // 2. Legacy fallback
  if (!window.ethereum) return null;
  
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    const mm = window.ethereum.providers.find((p) => p.isMetaMask && !p.isTrustWallet && !p.isBraveWallet && !p.isCoinbaseWallet);
    if (mm) return mm;
  }
  
  if (window.ethereum.isMetaMask && !window.ethereum.isTrustWallet && !window.ethereum.isBraveWallet && !window.ethereum.isCoinbaseWallet) {
    return window.ethereum;
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
    "register(string)": "f2c298be",
    "updateUsername(string)": "4f068b21",
    "getUsername(address)": "89e95522",
    "getAddress(string)": "bf40fac1",
    "isRegistered(address)": "c3c5a547",
    "isUsernameTaken(string)": "df092f1c",
    // DonationManager
    "donate(address,bool)": "600c3ad2",
    "withdraw()": "3ccfd60b",
    "donationCount()": "10e54b16",
    "donations(uint256)": "6f9fb98a",
    "getOrgDonationIds(address)": "c64dba56",
    "getUserDonationIds(address)": "3b75d86e",
    "getOrgStats(address)": "7ec9f3a2",
    "orgBalances(address)": "ee9ef588",
    "registry()": "7b103999",
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
  const logs = await provider().request({
    method: "eth_getLogs",
    params: [
      {
        address: contractAddress,
        topics: [eventTopic],
        fromBlock,
        toBlock: "latest",
      },
    ],
  });
  return logs;
}

// DonationMade event topic (keccak256 of the event signature)
// event DonationMade(uint256 indexed id, address indexed donor, address indexed organization, uint256 amount, bool anonymous, uint256 timestamp)
// We pre-compute this
export const DONATION_MADE_TOPIC = "0x9e15e1caa6e3e66bb81eb3eb1e2f040e06ceb00e867e2e9c3ce0a4aca6f11ee5";

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