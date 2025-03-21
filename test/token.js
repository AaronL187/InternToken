const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Token contract", function () {
  let InternToken, hardhatToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("InternToken");
    hardhatToken = await Token.deploy();
    console.log("Token deployed to:", hardhatToken.address);
  });

  it("Deployment should assign the total supply of tokens to the owner", async function () {
    //log the address of the owner
    console.log("Owner address:", owner);

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    console.log("Owner balance:", ownerBalance.toString());
    console.log("Owner Address:", owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function () {
    //transfer 50 tokens from owner to addr1
    await hardhatToken.transfer(addr1.address, 50);
    console.log(`Transferred 50 tokens from ${owner.address} to ${addr1.address}`);
    const addr1Balance = await hardhatToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(50);

    //transfer 50 tokens from addr1 to addr2
    await hardhatToken.connect(addr1).transfer(addr2.address, 50);
    console.log(`Transferred 50 tokens from ${addr1.address} to ${addr2.address}`);
    const addr2Balance = await hardhatToken.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(50);
  });
  it("Should fail if sender doesn’t have enough tokens", async function () {
    const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);
    //try to send 1 token from addr1 (0 balance) to owner
    await expect(hardhatToken.connect(addr1).transfer(owner.address, 1)).to.be.revertedWith("Not enough tokens");

    //owner balance should remain the same
    expect(await hardhatToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
  });
  it("Should update balances after transfers", async function () {
    const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);
    //transfer 100 tokens from owner to addr1
    await hardhatToken.transfer(addr1.address, 100);
    console.log(`Transferred 100 tokens from ${owner.address} to ${addr1.address}`);
    //transfer another 50 tokens from owner to addr2
    await hardhatToken.transfer(addr2.address, 50);
    console.log(`Transferred 50 tokens from ${owner.address} to ${addr2.address}`);

    const finalOwnerBalance = await hardhatToken.balanceOf(owner.address);
    expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);
    console.log("Owner balance after transfer:", finalOwnerBalance.toString());

    const addr1Balance = await hardhatToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(100);
    console.log("Addr1 balance after transfer:", addr1Balance.toString());

    const addr2Balance = await hardhatToken.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(50);
    console.log("Addr2 balance after transfer:", addr2Balance.toString
    ());
  });
});