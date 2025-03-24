# InternToken

InternToken is an ERC20-compliant smart contract with extended functionality. It leverages OpenZeppelin contracts and includes custom features such as transfer taxation, burning, pausing, and address blocklisting.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development Setup](#devsetup)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contract Details](#contract-details)
  - [InternToken.sol](#interntokensol)
  - [Events.sol](#eventssol)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Overview

InternToken is an ERC20 token with additional capabilities:
- **Burnable:** Users can destroy (burn) tokens.
- **Pausable:** The owner can pause all token transfers.
- **Transfer Tax & Burn:** Every transfer deducts a 2% tax (sent to a treasury wallet) and burns 1% of the amount.
- **Blocklist:** Ability to block addresses from sending/receiving tokens.
- **Permit:** Supports gas-less approvals via ERC20Permit.
- **Owner Control:** Minting, pausing, blocklisting, and treasury wallet management are restricted to the contract owner.

## Features

- **ERC20 Standard:** Implements the basic token interface.
- **Taxation on Transfers:** Automatically deducts a 2% fee that is sent to a treasury wallet.
- **Burn Mechanism:** Burns 1% of every transfer amount.
- **Pausable Transactions:** Allows the owner to temporarily disable transfers.
- **Blocklist:** Prevents specific addresses from participating in transfers.
- **Minting:** Owner can mint tokens up to a defined maximum supply.
- **ERC20Permit:** Enables approvals via signatures (gas-less transactions).

## Project Structure

```
InternToken/
├── contracts/
│   ├── InternToken.sol    # Main token contract with extended features
│   └── Events.sol         # Abstract contract defining custom events
├── scripts/
│   └── deploy.js          # Deployment script using Hardhat
├── test/
│   └── token.test.js      # Tests covering contract functionality
├── hardhat.config.js      # Hardhat configuration for deployment and testing
├── package.json           # Node.js project file
└── .gitignore             # Files and folders to ignore in Git
```

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/AaronL187/InternToken.git
   cd InternToken
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the project root with the following variables (replace placeholder values with your own):

```ini
API_KEY=<your Alchemy or Infura API key>
PRIVATE_KEY=<your private key without 0x prefix>
ETHERSCAN_API_KEY=<your Etherscan API key>
```

## Development Setup

To get started with development, follow these steps:

### 1. Install Hardhat

```bash
npm install --save-dev hardhat
npm install @nomiclabs/hardhat-ethers ethers @nomiclabs/hardhat-waffle ethereum-waffle chai
```

### 2. Create a Hardhat Project

```bash
npx hardhat
```

Follow the prompts to create a basic sample project.

### 3. Install Additional Dependencies

```bash
npm install chai@4.3.6
```

### 4. Install OpenZeppelin Contracts

```bash
npm install @openzeppelin/contracts
```

This is required for the InternToken contract, which uses OpenZeppelin's ERC20 extensions like `ERC20Burnable`, `ERC20Pausable`, and `ERC20Permit`.

## Deployment

To deploy the InternToken contract (for example, to the Sepolia network), run:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

The deployment script connects to the network using your API key and deploys the contract with the deployer's address as both the initial recipient of tokens and the owner.

## Testing

Run the tests with Hardhat:

```bash
npx hardhat test
```

The tests cover:
- **Deployment & Minting:** Initial token distribution and minting logic.
- **Transfer Mechanics:** Verification of tax deduction (2%) and burning (1%).
- **Pause/Unpause:** Ensuring transfers are halted when paused.
- **Blocklist:** Blocking and unblocking addresses.
- **Burn Functionality:** Validating that users can only burn tokens they own.

## Contract Details

### InternToken.sol

- **Constructor:**  
  - Mints an initial supply of 500,000 tokens (scaled by 10^18) to a specified recipient.
  - Sets the initial contract owner.
  - Emits a `Mint` event.

- **Transfer Logic:**  
  - Overrides the internal transfer update function (`_update`) to apply:
    - A 2% tax sent to the treasury wallet.
    - A 1% burn.
  - Checks that neither sender nor receiver is blocklisted.
  - Emits the following events:
    - `TaxTransferred`
    - `TokensBurned`
    - `TransferTokenAction`

- **Minting:**  
  - Only the owner can mint new tokens.
  - Total supply cannot exceed 1,000,000 tokens (scaled by 10^18).
  - Emits a `Mint` event upon successful minting.

- **Pause/Unpause:**  
  - Owner-only functions to pause or unpause token transfers.
  - Emits `Paused` and `Unpaused` events.

- **Blocklist Management:**  
  - Functions to block and unblock addresses.
  - Emits `BlockAddress` and `UnblockAddress` events.

- **Treasury Wallet Update:**  
  - The owner can update the treasury wallet (cannot be the zero or contract address).
  - Emits a `TreasuryWalletUpdated` event.

### Events.sol

This abstract contract defines custom events used in InternToken:

- `Mint(address indexed to, uint256 amount, uint256 timestamp)`
- `TaxTransferred(address indexed from, address indexed to, uint256 amount, uint256 timestamp)`
- `TokensBurned(address indexed from, uint256 amount, uint256 timestamp)`
- `TransferTokenAction(address indexed from, address indexed to, uint256 amount, uint256 timestamp)`
- `BlockAddress(address indexed target, uint256 timestamp)`
- `UnblockAddress(address indexed target, uint256 timestamp)`
- `TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet, uint256 timestamp)`

## Scripts

### deploy.js

The deployment script (located in the `scripts/` folder) performs the following:
- Reads the API key and private key from the `.env` file.
- Connects to the specified Ethereum network (e.g., Sepolia).
- Deploys the InternToken contract using the deployer’s wallet.
- Logs the deployed contract address.

## Contributing

Contributions and improvements are welcome! Feel free to submit issues or pull requests with proposed changes.

## License

This project is licensed under the MIT License.
