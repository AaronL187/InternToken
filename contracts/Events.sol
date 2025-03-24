// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

abstract contract TokenEvents {
    event Mint(address indexed to, uint256 amount, uint256 timestamp);
    event TaxTransferred(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    event TransferTokenAction(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event BlockAddress(address indexed target, uint256 timestamp);
    event UnblockAddress(address indexed target, uint256 timestamp);
    event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet, uint256 timestamp);
}