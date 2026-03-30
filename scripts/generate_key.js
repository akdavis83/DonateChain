const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const wallet = ethers.Wallet.createRandom();
const envContent = "PRIVATE_KEY=" + wallet.privateKey + "\\n";
fs.writeFileSync(path.join(__dirname, "../.env"), envContent);

console.log("NEW_WALLET_ADDRESS=" + wallet.address);

console.log("NEW_WALLET_ADDRESS=" + wallet.address);
