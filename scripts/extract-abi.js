const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("📦 Extracting Contract ABI and Bytecode...\n");

  // Get contract artifacts
  const userRegistryArtifact = await hre.artifacts.readArtifact("UserRegistry");
  const donationManagerArtifact = await hre.artifacts.readArtifact("DonationManager");

  // Create frontend config template
  const frontendConfig = {
    userRegistry: {
      address: "USER_REGISTRY_ADDRESS_HERE",
      abi: userRegistryArtifact.abi
    },
    donationManager: {
      address: "DONATION_MANAGER_ADDRESS_HERE",
      abi: donationManagerArtifact.abi,
      constructorArgs: ["USER_REGISTRY_ADDRESS_HERE"]
    }
  };

  // Save frontend config
  fs.writeFileSync(
    "frontend-config.json",
    JSON.stringify(frontendConfig, null, 2)
  );
  console.log("✅ Frontend config saved to: frontend-config.json");

  // Save detailed artifact info
  const contractInfo = {
    UserRegistry: {
      abi: userRegistryArtifact.abi,
      bytecode: userRegistryArtifact.bytecode,
      deployedBytecode: userRegistryArtifact.deployedBytecode,
      sourceName: userRegistryArtifact.sourceName,
      contractName: userRegistryArtifact.contractName
    },
    DonationManager: {
      abi: donationManagerArtifact.abi,
      bytecode: donationManagerArtifact.bytecode,
      deployedBytecode: donationManagerArtifact.deployedBytecode,
      sourceName: donationManagerArtifact.sourceName,
      contractName: donationManagerArtifact.contractName,
      constructorArgs: ["USER_REGISTRY_ADDRESS_HERE"]
    }
  };

  fs.writeFileSync(
    "contract-info.json",
    JSON.stringify(contractInfo, null, 2)
  );
  console.log("✅ Contract info saved to: contract-info.json");

  // Print summary
  console.log("\n📊 Contract Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nUserRegistry:");
  console.log("  Functions:", userRegistryArtifact.abi.filter(x => x.type === 'function').length);
  console.log("  Events:", userRegistryArtifact.abi.filter(x => x.type === 'event').length);
  console.log("  Errors:", userRegistryArtifact.abi.filter(x => x.type === 'error').length);
  
  console.log("\nDonationManager:");
  console.log("  Functions:", donationManagerArtifact.abi.filter(x => x.type === 'function').length);
  console.log("  Events:", donationManagerArtifact.abi.filter(x => x.type === 'event').length);
  console.log("  Errors:", donationManagerArtifact.abi.filter(x => x.type === 'error').length);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📝 Next steps:");
  console.log("1. Create .env file with your PRIVATE_KEY");
  console.log("2. Run: npm run deploy:testnet");
  console.log("3. Update addresses in dashboard2.html or frontend-config.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
