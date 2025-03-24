const { ethers } = require("hardhat");
const { expect } = require("chai");
const { get } = require("http");

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
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(toWei(500000));
    });

    it("Total supply should equal owner balance plus minted tokens", async function () {
      // Mint tokens to addr1 and addr2
      const mintAmount = toWei(1000);
      await hardhatToken.mint(addr1.address, mintAmount);
      await hardhatToken.mint(addr2.address, mintAmount);

      const totalSupply = await hardhatToken.totalSupply();
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

    it("Should revert when minting zero tokens", async function () {
      await expect(
        hardhatToken.mint(addr1.address, 0)
      ).to.be.revertedWith("InternToken: mint amount must be greater than 0");
    });

    it("Should only allow the owner to mint tokens", async function () {
      await expect(
        hardhatToken.connect(addr1).mint(addr1.address, toWei(100))
      ).to.be.reverted;
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

    it("Should revert transfers of zero tokens", async function () {
      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, 0)
      ).to.be.revertedWith("InternToken: transfer amount must be greater than 0");
    });
  });

  // --------------------- Pause/Unpause Tests --------------------- //
  describe("Pause/Unpause Functionality", function () {
    beforeEach(async function () {
      // Mint tokens for testing transfer during pause/unpause
      await hardhatToken.mint(addr1.address, toWei(1000));
    });

    it("Should allow owner to pause and unpause the contract", async function () {
      await hardhatToken.connect(owner).pause();
      expect(await hardhatToken.paused()).to.be.true;
      await hardhatToken.connect(owner).unpause();
      expect(await hardhatToken.paused()).to.be.false;
    });

    it("Should revert transfers when paused", async function () {
      await hardhatToken.pause();
      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, toWei(100))
      ).to.be.revertedWith("InternToken: token transfer while paused");
    });

    it("Should allow transfers after unpausing", async function () {
      await hardhatToken.pause();
      await hardhatToken.unpause();
      await hardhatToken.connect(addr1).transfer(addr2.address, toWei(100));
      const addr2Balance = await hardhatToken.balanceOf(addr2.address);
      expect(addr2Balance).to.be.gt(0);
    });

    it("Should only allow owner to pause/unpause", async function () {
      await expect(
        hardhatToken.connect(addr1).pause()
      ).to.be.reverted;
      await hardhatToken.pause();
      await expect(
        hardhatToken.connect(addr1).unpause()
      ).to.be.reverted;
    });
  });

  // --------------------- Treasury Wallet Tests --------------------- //
  describe("Treasury Wallet", function () {
    it("Should only allow owner to set treasury wallet", async function () {
      await expect(
        hardhatToken.connect(addr1).setTreasuryWallet(treasuryWallet.address)
      ).to.be.reverted;
    });

    it("Should revert when setting treasury wallet to the zero address", async function () {
      await expect(
        hardhatToken.setTreasuryWallet(ethers.constants.AddressZero)
      ).to.be.revertedWith("InternToken: treasury wallet is the zero address");
    });

    it("Should revert when setting treasury wallet to the contract address", async function () {
      await expect(
        hardhatToken.setTreasuryWallet(hardhatToken.address)
      ).to.be.revertedWith("InternToken: treasury wallet is the contract address");
    });
  });

  // --------------------- Blocklist Tests --------------------- //
  describe("Blocklist Functionality", function () {
    it("Should block and unblock an address", async function () {
      await hardhatToken.blockAddress(addr1.address);
      expect(await hardhatToken.blocklist(addr1.address)).to.be.true;
      await hardhatToken.unblockAddress(addr1.address);
      expect(await hardhatToken.blocklist(addr1.address)).to.be.false;
    });

    it("Should revert transfer from a blocked sender", async function () {
      await hardhatToken.mint(addr1.address, toWei(1000));
      await hardhatToken.blockAddress(addr1.address);
      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, toWei(100))
      ).to.be.revertedWith("InternToken: sender is blocked");
    });

    it("Should revert transfer to a blocked recipient", async function () {
      await hardhatToken.mint(addr1.address, toWei(1000));
      await hardhatToken.blockAddress(addr2.address);
      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, toWei(100))
      ).to.be.revertedWith("InternToken: recipient is blocked");
    });

    it("Should only allow owner to block or unblock addresses", async function () {
      await expect(
        hardhatToken.connect(addr1).blockAddress(addr2.address)
      ).to.be.reverted;
      await hardhatToken.blockAddress(addr2.address);
      await expect(
        hardhatToken.connect(addr1).unblockAddress(addr2.address)
      ).to.be.reverted;
    });
  });

  describe("Burn Functionality", function () {
    const burnAmount = toWei(100);
  
    beforeEach(async function () {
      await hardhatToken.mint(addr1.address, toWei(1000));
      
    });
  
    it("Should allow a user to burn their own tokens", async function () {
      const balanceBefore = await hardhatToken.balanceOf(addr1.address);
      const totalSupplyBefore = await hardhatToken.totalSupply();
  
      await hardhatToken.connect(addr1).burn(burnAmount);
  
      const balanceAfter = await hardhatToken.balanceOf(addr1.address);
      const totalSupplyAfter = await hardhatToken.totalSupply();
  
      expect(balanceAfter).to.equal(balanceBefore.sub(burnAmount));
      expect(totalSupplyAfter).to.equal(totalSupplyBefore.sub(burnAmount));
    });
  
    it("Should revert when trying to burn 0 tokens", async function () {
      await expect(
        hardhatToken.connect(addr1).burn(0)
      ).to.be.revertedWith("InternToken: burn amount must be greater than 0");
    });
  
    it("Should revert when user tries to burn more than their balance", async function () {
      const tooMuch = toWei(2000); // More than minted
      await expect(
        hardhatToken.connect(addr1).burn(tooMuch)
      ).to.be.revertedWith("InternToken: burn amount exceeds balance");
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

  function getBlockTimestamp() {
    return ethers.provider.getBlock("latest").then((block) => block.timestamp);
  }
  function isTimeStampValid(timestamp) {
    return timestamp > 0 && timestamp < 10000000000;
  }
});
