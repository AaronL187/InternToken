const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InternToken Contract", function () {
  let InternToken, hardhatToken, owner, addr1, addr2, treasuryWallet;

  beforeEach(async function () {
    [owner, addr1, addr2, treasuryWallet] = await ethers.getSigners();
    InternToken = await ethers.getContractFactory("InternToken");
    hardhatToken = await InternToken.deploy(owner.address, owner.address);
    console.log("Token deployed to:", hardhatToken.address);

    const mintAmount = toWei(1000);
    await hardhatToken.mint(addr1.address, mintAmount);
    await hardhatToken.mint(addr2.address, mintAmount);

    const balance1 = await hardhatToken.balanceOf(addr1.address);
    const balance2 = await hardhatToken.balanceOf(addr2.address);
    console.log("Addr1 balance:", balance1.toString());
    console.log("Addr2 balance:", balance2.toString());

    expect(balance1).to.equal(mintAmount);
    expect(balance2).to.equal(mintAmount);
  });

  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    console.log("Owner balance:", ownerBalance.toString());

    const totalSupply = await hardhatToken.totalSupply();
    expect(totalSupply).to.equal(ownerBalance.add(toWei(2000))); // 1000 to addr1 + 1000 to addr2

    // Should revert when minting over the max supply
    await expect(
      hardhatToken.mint(owner.address, toWei(2000000))
    ).to.be.revertedWith("InternToken: mint amount exceeds total supply");

    // Valid mint
    await hardhatToken.mint(owner.address, toWei(1000));
    const newOwnerBalance = await hardhatToken.balanceOf(owner.address);
    console.log("Owner balance after minting:", newOwnerBalance.toString());

    expect(newOwnerBalance).to.equal(ownerBalance.add(toWei(1000)));
  });

  it("Should have correct name, symbol, and decimals", async function () {
    expect(await hardhatToken.name()).to.equal("InternToken");
    expect(await hardhatToken.symbol()).to.equal("INT");
    expect(await hardhatToken.decimals()).to.equal(18);
  });

  it("Should burn 1% and send 2% to treasury on transfer", async function () {
    await hardhatToken.setTreasuryWallet(treasuryWallet.address);

    const transferAmount = toWei(100); // 100 INT
    const taxAmount = transferAmount.mul(2).div(100); // 2%
    const burnAmount = transferAmount.mul(1).div(100); // 1%
    const expectedReceived = transferAmount.sub(taxAmount).sub(burnAmount); // 97%

    const treasuryBefore = await hardhatToken.balanceOf(treasuryWallet.address);
    const totalSupplyBefore = await hardhatToken.totalSupply();

    await hardhatToken.connect(addr1).transfer(addr2.address, transferAmount);

    const user1Balance = await hardhatToken.balanceOf(addr1.address);
    const user2Balance = await hardhatToken.balanceOf(addr2.address);
    const treasuryAfter = await hardhatToken.balanceOf(treasuryWallet.address);
    const totalSupplyAfter = await hardhatToken.totalSupply();

    console.log("User2 received:", user2Balance.toString());
    console.log("Treasury received:", treasuryAfter.sub(treasuryBefore).toString());
    console.log("Total supply reduced by:", totalSupplyBefore.sub(totalSupplyAfter).toString());

    expect(user2Balance).to.equal(toWei(1000).add(expectedReceived));
    expect(treasuryAfter.sub(treasuryBefore)).to.equal(taxAmount);
    expect(totalSupplyBefore.sub(totalSupplyAfter)).to.equal(burnAmount);
    

    expect(user1Balance).to.equal(toWei(1000).sub(transferAmount));
    expect(user2Balance).to.equal(toWei(1000).add(expectedReceived));
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