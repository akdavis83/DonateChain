const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Updating frontend configuration with deployed contract addresses...\n");

  // Read contract-info.json
  const contractInfoPath = path.join(__dirname, "..", "contract-info.json");
  const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, "utf8"));

  // Read the deployed addresses from artifacts
  const hre = require("hardhat");
  const { ethers } = require("hardhat");
  
  // Get the latest deployment addresses from network
  const networkName = hre.network.name;
  console.log(`Network: ${networkName}`);
  
  // For RSK Testnet, we'll use the addresses from contract-info.json
  // These should be updated after deployment
  const userRegistryAddress = process.env.USER_REGISTRY_ADDRESS || contractInfo.UserRegistry.deployedAddress;
  const donationManagerAddress = process.env.DONATION_MANAGER_ADDRESS || contractInfo.DonationManager.deployedAddress;

  if (!userRegistryAddress || !donationManagerAddress) {
    console.error("Error: Contract addresses not found. Please run deployment first.");
    console.error("Usage: npx hardhat run scripts/deploy.js --network rskTestnet");
    process.exit(1);
  }

  // Update contracts.js in frontend
  const frontendContractsPath = path.join(__dirname, "..", "..", "src", "lib", "contracts.js");
  let contractsContent = fs.readFileSync(frontendContractsPath, "utf8");

  // Update contract addresses using regex
  contractsContent = contractsContent.replace(
    /UserRegistry:\s*"0x[a-fA-F0-9]{40}"/,
    `UserRegistry: "${userRegistryAddress}"`
  );
  contractsContent = contractsContent.replace(
    /DonationManager:\s*"0x[a-fA-F0-9]{40}"/,
    `DonationManager: "${donationManagerAddress}"`
  );

  fs.writeFileSync(frontendContractsPath, contractsContent);
  console.log(`✓ Updated src/lib/contracts.js with new addresses`);

  // Update frontend-config.json
  const frontendConfigPath = path.join(__dirname, "..", "frontend-config.json");
  const frontendConfig = {
    userRegistry: {
      address: userRegistryAddress,
      abi: contractInfo.UserRegistry.abi
    },
    donationManager: {
      address: donationManagerAddress,
      abi: contractInfo.DonationManager.abi,
      constructorArgs: [userRegistryAddress]
    }
  };

  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  console.log(`✓ Updated frontend-config.json`);

  console.log("\n==========================================");
  console.log("Frontend Configuration Updated!");
  console.log("==========================================");
  console.log(`UserRegistry:    ${userRegistryAddress}`);
  console.log(`DonationManager: ${donationManagerAddress}`);
  console.log("==========================================\n");
  console.log("Next steps:");
  console.log("1. Restart your frontend dev server if running");
  console.log("2. Clear browser cache and reload");
  console.log("3. Test username registration and donations");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
