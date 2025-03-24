require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    `https://eth-sepolia.g.alchemy.com/v2/${process.env.API_KEY}`
  );

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying contract with:", wallet.address);

  const factory = await ethers.getContractFactory("InternToken", wallet);
  const recipient = wallet.address;
  const owner = wallet.address;

  const token = await factory.deploy(recipient, owner);
  await token.deployed();

  console.log(` Contract deployed at: ${token.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
