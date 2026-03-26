const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Donation Protocol", function () {
  let UserRegistry, userRegistry;
  let DonationManager, donationManager;
  let owner, donor, org, other;

  beforeEach(async function () {
    [owner, donor, org, other] = await ethers.getSigners();

    // Deploy UserRegistry
    UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();

    // Deploy DonationManager
    DonationManager = await ethers.getContractFactory("DonationManager");
    donationManager = await DonationManager.deploy(await userRegistry.getAddress());
    await donationManager.waitForDeployment();
  });

  describe("UserRegistry", function () {
    it("Should register a username successfully", async function () {
      await userRegistry.connect(donor).registerUsername("DonorBob");
      expect(await userRegistry.getUsername(donor.address)).to.equal("DonorBob");
      expect(await userRegistry.hasUsername(donor.address)).to.be.true;
    });

    it("Should enforce username uniqueness", async function () {
      await userRegistry.connect(donor).registerUsername("Alice");
      await expect(
        userRegistry.connect(other).registerUsername("Alice")
      ).to.be.revertedWithCustomError(userRegistry, "UsernameAlreadyTaken");
    });

    it("Should revert on empty username", async function () {
      await expect(
        userRegistry.connect(donor).registerUsername("")
      ).to.be.revertedWithCustomError(userRegistry, "UsernameEmpty");
    });

    it("Should revert on long usernames", async function () {
      const longName = "a".repeat(31);
      await expect(
        userRegistry.connect(donor).registerUsername(longName)
      ).to.be.revertedWithCustomError(userRegistry, "UsernameTooLong");
    });

    it("Should allow updating a username and release the old one", async function () {
      await userRegistry.connect(donor).registerUsername("OldName");
      await userRegistry.connect(donor).registerUsername("NewName");
      
      expect(await userRegistry.getUsername(donor.address)).to.equal("NewName");
      // Check if OldName is released
      expect(await userRegistry.isUsernameTaken("OldName")).to.be.false;
      // Other user can now take OldName
      await expect(userRegistry.connect(other).registerUsername("OldName")).to.not.be.reverted;
    });
  });

  describe("DonationManager", function () {
    it("Should handle a standard donation correctly", async function () {
      const donationAmount = ethers.parseEther("1.0");
      
      // Check initial balance of org
      const initialOrgBalance = await ethers.provider.getBalance(org.address);

      // Perform donation
      const tx = await donationManager.connect(donor).donate(org.address, false, {
        value: donationAmount,
      });

      // Verify funds were forwarded immediately
      const finalOrgBalance = await ethers.provider.getBalance(org.address);
      expect(finalOrgBalance - initialOrgBalance).to.equal(donationAmount);

      // Verify event was emitted
      await expect(tx)
        .to.emit(donationManager, "DonationMade")
        .withArgs(1, donor.address, org.address, donationAmount, false, anyValue => true);

      // Verify stats
      const stats = await donationManager.getOrgStats(org.address);
      expect(stats.totalReceived).to.equal(donationAmount);
      expect(stats.totalDonations).to.equal(1);
    });

    it("Should correctly log anonymous donations", async function () {
      const donationAmount = ethers.parseEther("0.5");
      
      const tx = await donationManager.connect(donor).donate(org.address, true, {
        value: donationAmount,
      });

      await expect(tx)
        .to.emit(donationManager, "DonationMade")
        .withArgs(1, donor.address, org.address, donationAmount, true, anyValue => true);
    });

    it("Should revert on zero-value donations", async function () {
      await expect(
        donationManager.connect(donor).donate(org.address, false, { value: 0 })
      ).to.be.revertedWithCustomError(donationManager, "InvalidAmount");
    });

    it("Should revert on donation to zero address", async function () {
      await expect(
        donationManager.connect(donor).donate(ethers.ZeroAddress, false, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(donationManager, "InvalidOrganization");
    });

    it("Should reject direct RBTC transfers", async function () {
      await expect(
        donor.sendTransaction({
          to: await donationManager.getAddress(),
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith("Use donate()");
    });

    it("Should track multiple donations correctly", async function () {
      const amt1 = ethers.parseEther("1");
      const amt2 = ethers.parseEther("2");

      await donationManager.connect(donor).donate(org.address, false, { value: amt1 });
      await donationManager.connect(other).donate(org.address, false, { value: amt2 });

      const stats = await donationManager.getOrgStats(org.address);
      expect(stats.totalReceived).to.equal(amt1 + amt2);
      expect(stats.totalDonations).to.equal(2);
    });
  });

  describe("Integration", function () {
    it("Should link UserRegistry data during donation tracking", async function () {
      // Register donor
      await userRegistry.connect(donor).registerUsername("CharityChamp");
      
      // Perform donation
      await donationManager.connect(donor).donate(org.address, false, {
        value: ethers.parseEther("1"),
      });

      // In a real dApp, we query the donor from the event and then check the registry
      const donation = await donationManager.getDonation(1);
      const username = await userRegistry.getUsername(donation.donor);
      
      expect(username).to.equal("CharityChamp");
    });
  });
});
