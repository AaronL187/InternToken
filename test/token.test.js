const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InternToken Contract", function () {
  let InternToken, hardhatToken, owner, addr1, addr2, treasuryWallet;

  // Common setup: deploy the contract before each test suite
  beforeEach(async function () {
    [owner, addr1, addr2, treasuryWallet] = await ethers.getSigners();
    InternToken = await ethers.getContractFactory("InternToken");
    hardhatToken = await InternToken.deploy(owner.address, owner.address);
  });

  // --------------------- Deployment Tests --------------------- //
  describe("Deployment", function () {
    it("Should assign the initial supply to the owner", async function () {
      // The initial supply is minted in the constructor to the recipient (here, owner)
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(toWei(500000));
    });

    it("Total supply should equal owner balance plus minted tokens", async function () {
      // Mint tokens to addr1 and addr2
      const mintAmount = toWei(1000);
      await hardhatToken.mint(addr1.address, mintAmount);
      await hardhatToken.mint(addr2.address, mintAmount);

      const totalSupply = await hardhatToken.totalSupply();
      // Total supply should be: initial owner's supply + 2 * mintAmount
      const expectedSupply = (await hardhatToken.balanceOf(owner.address)).add(toWei(2000));
      expect(totalSupply).to.equal(expectedSupply);
    });
  });

  // --------------------- Minting Tests --------------------- //
  describe("Minting", function () {
    beforeEach(async function () {
      // Mint tokens to addr1 and addr2 for testing mint functionality
      const mintAmount = toWei(1000);
      await hardhatToken.mint(addr1.address, mintAmount);
      await hardhatToken.mint(addr2.address, mintAmount);
    });

    it("Should mint tokens to provided addresses", async function () {
      const balance1 = await hardhatToken.balanceOf(addr1.address);
      const balance2 = await hardhatToken.balanceOf(addr2.address);
      expect(balance1).to.equal(toWei(1000));
      expect(balance2).to.equal(toWei(1000));
    });

    it("Should revert when minting over the max supply", async function () {
      await expect(
        hardhatToken.mint(owner.address, toWei(2000000))
      ).to.be.revertedWith("InternToken: mint amount exceeds total supply");
    });

    it("Should allow valid mint operations", async function () {
      const ownerBalanceBefore = await hardhatToken.balanceOf(owner.address);
      await hardhatToken.mint(owner.address, toWei(1000));
      const ownerBalanceAfter = await hardhatToken.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(toWei(1000)));
    });
  });

  // --------------------- Metadata Tests --------------------- //
  describe("Metadata", function () {
    it("Should have correct name, symbol, and decimals", async function () {
      expect(await hardhatToken.name()).to.equal("InternToken");
      expect(await hardhatToken.symbol()).to.equal("INT");
      expect(await hardhatToken.decimals()).to.equal(18);
    });
  });

  // --------------------- Tokenomics Tests --------------------- //
  describe("Tokenomics: Transfers (Tax & Burn)", function () {
    beforeEach(async function () {
      // Mint tokens for transfers and set the treasury wallet
      const mintAmount = toWei(1000);
      await hardhatToken.mint(addr1.address, mintAmount);
      await hardhatToken.mint(addr2.address, mintAmount);
      await hardhatToken.setTreasuryWallet(treasuryWallet.address);
    });

    it("Should burn 1% and send 2% to treasury on transfer", async function () {
      const transferAmount = toWei(100); // 100 INT
      const taxAmount = transferAmount.mul(2).div(100);   // 2%
      const burnAmount = transferAmount.mul(1).div(100);    // 1%
      const expectedReceived = transferAmount.sub(taxAmount).sub(burnAmount); // 97%

      const treasuryBefore = await hardhatToken.balanceOf(treasuryWallet.address);
      const totalSupplyBefore = await hardhatToken.totalSupply();

      // Perform the transfer from addr1 to addr2
      await hardhatToken.connect(addr1).transfer(addr2.address, transferAmount);

      const user1Balance = await hardhatToken.balanceOf(addr1.address);
      const user2Balance = await hardhatToken.balanceOf(addr2.address);
      const treasuryAfter = await hardhatToken.balanceOf(treasuryWallet.address);
      const totalSupplyAfter = await hardhatToken.totalSupply();

      expect(user1Balance).to.equal(toWei(1000).sub(transferAmount));
      expect(user2Balance).to.equal(toWei(1000).add(expectedReceived));
      expect(treasuryAfter.sub(treasuryBefore)).to.equal(taxAmount);
      expect(totalSupplyBefore.sub(totalSupplyAfter)).to.equal(burnAmount);
    });
  });

  // --------------------- Blocklist Tests --------------------- //
  describe("Blocklist Functionality", function () {
    it("Should block and unblock an address", async function () {
      // Block addr1 and check its status
      await hardhatToken.blockAddress(addr1.address);
      expect(await hardhatToken.blocklist(addr1.address)).to.be.true;
      
      // Unblock addr1 and check its status
      await hardhatToken.unblockAddress(addr1.address);
      expect(await hardhatToken.blocklist(addr1.address)).to.be.false;
    });

    it("Should revert transfer from a blocked sender", async function () {
      const mintAmount = toWei(1000);
      await hardhatToken.mint(addr1.address, mintAmount);
      await hardhatToken.blockAddress(addr1.address);
      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, toWei(100))
      ).to.be.revertedWith("InternToken: sender is blocked");
    });

    it("Should revert transfer to a blocked recipient", async function () {
      const mintAmount = toWei(1000);
      await hardhatToken.mint(addr1.address, mintAmount);
      await hardhatToken.blockAddress(addr2.address);
      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, toWei(100))
      ).to.be.revertedWith("InternToken: recipient is blocked");
    });
  });

  /**
   * Helper function to convert a value to Wei (10^18).
   * @param {number|string} value - The value to be converted.
   * @returns {BigNumber} - The value in Wei.
   */
  function toWei(value) {
    return ethers.utils.parseUnits(value.toString(), 18);
  }
});
