const { ethers } = require("hardhat");
const { expect } = require("chai");

/**
 * Test suite for the InternToken contract.
 */
describe("Token contract", function () {
    let InternToken, hardhatToken, owner, addr1, addr2;

    /**
     * Hook that runs before each test, deploying the contract and setting up signers.
     */
    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        InternToken = await ethers.getContractFactory("InternToken");
        hardhatToken = await InternToken.deploy(owner.address, owner.address);
        console.log("Token deployed to:", hardhatToken.address);
    });

    /**
     * Test case to check if the total supply of tokens is assigned to the owner upon deployment.
     */
    it("Deployment should assign the total supply of tokens to the owner", async function () {
        console.log("Owner address:", owner);

        const ownerBalance = await hardhatToken.balanceOf(owner.address);
        console.log("Owner balance:", ownerBalance.toString());
        console.log("Owner Address:", owner.address);
        expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);

        //Check what happens if the MAX_SUPPLY is reached
        await expect(hardhatToken.mint(owner.address, 2000000)).to.be.revertedWith("InternToken: mint amount exceeds total supply");
        //Mint 1000 tokens to the owner
        await hardhatToken.mint(owner.address, 1000);
        const newOwnerBalance = await hardhatToken.balanceOf(owner.address);
        console.log("Owner balance after minting:", await newOwnerBalance.toString());

    });
    it("Check the name, symbol and decimals legitness.", async function () {
        expect(await hardhatToken.name()).to.equal("InternToken");
        console.log("Name is correct");
        expect(await hardhatToken.symbol()).to.equal("INT");
        console.log("Symbol is correct");
        expect(await hardhatToken.decimals()).to.equal(18);
        console.log("Decimals is correct");
    });
});
//     //try to send 1 token from addr1 (0 balance) to owner
//     await expect(hardhatToken.connect(addr1).transfer(owner.address, 1)).to.be.revertedWith("Not enough tokens");

//     //owner balance should remain the same
//     expect(await hardhatToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
//   });
//   it("Should update balances after transfers", async function () {
//     const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);
//     //transfer 100 tokens from owner to addr1
//     await hardhatToken.transfer(addr1.address, 100);
//     console.log(`Transferred 100 tokens from ${owner.address} to ${addr1.address}`);
//     //transfer another 50 tokens from owner to addr2
//     await hardhatToken.transfer(addr2.address, 50);
//     console.log(`Transferred 50 tokens from ${owner.address} to ${addr2.address}`);

//     const finalOwnerBalance = await hardhatToken.balanceOf(owner.address);
//     expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);
//     console.log("Owner balance after transfer:", finalOwnerBalance.toString());

//     const addr1Balance = await hardhatToken.balanceOf(addr1.address);
//     expect(addr1Balance).to.equal(100);
//     console.log("Addr1 balance after transfer:", addr1Balance.toString());

//     const addr2Balance = await hardhatToken.balanceOf(addr2.address);
//     expect(addr2Balance).to.equal(50);
//     console.log("Addr2 balance after transfer:", addr2Balance.toString
//     ());
//   });