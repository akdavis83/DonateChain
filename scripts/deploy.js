const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment on RSK Testnet...\n");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "tRBTC\n");

  // 1. Deploy UserRegistry
  console.log("Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const registry = await UserRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("UserRegistry deployed to:", registryAddress);

  // 2. Deploy DonationManager
  console.log("Deploying DonationManager...");
  const DonationManager = await hre.ethers.getContractFactory("DonationManager");
  const manager = await DonationManager.deploy(registryAddress);
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log("DonationManager deployed to:", managerAddress);

  console.log("\nWaiting for block confirmations to ensure Blockscout indexing...");
  // Wait 4 blocks for verification
  const txManager = manager.deploymentTransaction();
  await txManager.wait(4);
  console.log("Blocks confirmed!\n");

  console.log("Verifying UserRegistry...");
  try {
    await hre.run("verify:verify", {
      address: registryAddress,
      constructorArguments: [],
    });
    console.log("✓ UserRegistry verified");
  } catch (e) {
    console.error("Registry Verification failed: ", e.message);
  }

  console.log("Verifying DonationManager...");
  try {
    await hre.run("verify:verify", {
      address: managerAddress,
      constructorArguments: [registryAddress],
    });
    console.log("✓ DonationManager verified");
  } catch (e) {
    console.error("Manager Verification failed: ", e.message);
  }

  // Read existing contract-info.json to preserve ABI
  const contractInfoPath = path.join(__dirname, "..", "contract-info.json");
  let contractInfo = {};
  if (fs.existsSync(contractInfoPath)) {
    contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, "utf8"));
  }

  // Get ABI from artifacts
  const userRegistryArtifact = require(path.join(__dirname, "..", "artifacts", "contracts", "UserRegistry.sol", "UserRegistry.json"));
  const donationManagerArtifact = require(path.join(__dirname, "..", "artifacts", "contracts", "DonationManager.sol", "DonationManager.json"));

  // Update contract-info.json
  contractInfo.UserRegistry = {
    abi: userRegistryArtifact.abi,
    bytecode: userRegistryArtifact.bytecode,
    deployedBytecode: userRegistryArtifact.deployedBytecode,
    sourceName: "contracts/UserRegistry.sol",
    contractName: "UserRegistry",
    deployedAddress: registryAddress
  };

  contractInfo.DonationManager = {
    abi: donationManagerArtifact.abi,
    bytecode: donationManagerArtifact.bytecode,
    deployedBytecode: donationManagerArtifact.deployedBytecode,
    sourceName: "contracts/DonationManager.sol",
    contractName: "DonationManager",
    deployedAddress: managerAddress,
    constructorArgs: [registryAddress]
  };

  fs.writeFileSync(contractInfoPath, JSON.stringify(contractInfo, null, 2));
  console.log("\n✓ Updated contract-info.json");

  console.log("\n==========================================");
  console.log("Deployment & Verification Complete!");
  console.log("==========================================");
  console.log("UserRegistry:    ", registryAddress);
  console.log("DonationManager: ", managerAddress);
  console.log("==========================================\n");

  // Update frontend contracts.js
  const frontendContractsPath = path.join(__dirname, "..", "..", "src", "lib", "contracts.js");
  let contractsContent = fs.readFileSync(frontendContractsPath, "utf8");

  // Update contract addresses using regex
  contractsContent = contractsContent.replace(
    /UserRegistry:\s*"0x[a-fA-F0-9]{40}"/,
    `UserRegistry: "${registryAddress}"`
  );
  contractsContent = contractsContent.replace(
    /DonationManager:\s*"0x[a-fA-F0-9]{40}"/,
    `DonationManager: "${managerAddress}"`
  );

  fs.writeFileSync(frontendContractsPath, contractsContent);
  console.log("✓ Updated frontend src/lib/contracts.js");

  console.log("\nNext steps:");
  console.log("1. Restart your frontend dev server if running");
  console.log("2. Clear browser cache and reload");
  console.log("3. Test username registration and donations");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
