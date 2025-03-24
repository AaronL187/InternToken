// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

abstract contract TokenEvents {
    event Mint(address indexed to, uint256 amount);
    event TaxTransferred(address indexed from, address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event TransferTokenAction(address indexed from, address indexed to, uint256 amount);
    event BlockAddress(address indexed target);
    event UnblockAddress(address indexed target);
    event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet);
}