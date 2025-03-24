// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TokenEvents} from "./Events.sol";

contract InternToken is
    ERC20,
    ERC20Burnable,
    ERC20Pausable,
    Ownable,
    ERC20Permit,
    TokenEvents
{
    uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18;
    uint256 public constant INITIAL_SUPPLY = 500000 * 10 ** 18;
    address public treasuryWallet;

    /**
     * @dev Initializes the InternToken contract.
     * Mints the initial supply to the provided recipient and sets the initial owner.
     *
     * @param recipient Address receiving the initial token supply.
     * @param initialOwner Address set as the contract owner.
     */
    constructor(
        address recipient,
        address initialOwner
    )
        ERC20("InternToken", "INT")
        Ownable(initialOwner)
        ERC20Permit("InternToken")
    {
        mint(recipient, INITIAL_SUPPLY);
        emit Mint(recipient, INITIAL_SUPPLY);
    }

    /**
     * @dev Pauses all token transfers.
     * Can only be called by the owner.
     * Emits a {Paused} event.
     */
    function pause() public onlyOwner {
        _pause();
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpauses all token transfers.
     * Can only be called by the owner.
     * Emits an {Unpaused} event.
     */
    function unpause() public onlyOwner {
        _unpause();
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Sets the treasury wallet address.
     * Can only be called by the owner.
     *
     * Requirements:
     * - `_treasuryWallet` cannot be the zero address.
     * - `_treasuryWallet` cannot be the contract address.
     *
     * Emits a {TreasuryWalletUpdated} event.
     *
     * @param _treasuryWallet The address of the new treasury wallet.
     */
    function setTreasuryWallet(address _treasuryWallet) public onlyOwner {
        require(
            _treasuryWallet != address(0),
            "InternToken: treasury wallet is the zero address"
        );
        require(
            _treasuryWallet != address(this),
            "InternToken: treasury wallet is the contract address"
        );
        address oldTreasuryWallet = treasuryWallet;
        treasuryWallet = _treasuryWallet;
        emit TreasuryWalletUpdated(oldTreasuryWallet, _treasuryWallet);
    }

    /**
     * @dev Mapping tracking addresses that are blocked.
     */
    mapping(address => bool) public blocklist;

    /**
     * @dev Blocks a specific address from transferring or receiving tokens.
     * Can only be called by the owner.
     *
     * Emits a {BlockAddress} event.
     *
     * @param _address The address to block.
     */
    function blockAddress(address _address) public onlyOwner {
        blocklist[_address] = true;
        emit BlockAddress(_address);
    }

    /**
     * @dev Unblocks a previously blocked address.
     * Can only be called by the owner.
     *
     * Emits an {UnblockAddress} event.
     *
     * @param _address The address to unblock.
     */
    function unblockAddress(address _address) public onlyOwner {
        blocklist[_address] = false;
        emit UnblockAddress(_address);
    }

    /**
     * @dev Mints `amount` tokens to `to`, increasing total supply.
     *
     * Requirements:
     * - `to` cannot be the zero address.
     * - `amount` must be greater than 0.
     * - Total supply after minting must not exceed `MAX_SUPPLY`.
     * - Can only be called by the owner.
     *
     * Emits a {Mint} event.
     *
     * @param to The address receiving the minted tokens.
     * @param amount The number of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "InternToken: mint to the zero address");
        require(amount > 0, "InternToken: mint amount must be greater than 0");
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "InternToken: mint amount exceeds total supply"
        );
        emit Mint(to, amount);
        super._mint(to, amount);
    }

    /**
     * @dev Transfers tokens and applies tax and burn mechanisms.
     * Overrides `_update` from ERC20 and ERC20Pausable.
     *
     * Requirements:
     * - Contract must not be paused.
     * - Sender and recipient must not be blocked.
     * - Transfer amount must be greater than 0.
     * - Sender must have enough balance.
     *
     * Emits {TaxTransferred}, {TokensBurned}, and {TransferTokenAction} events.
     *
     * @param from The sender's address.
     * @param to The recipient's address.
     * @param value The amount of tokens to transfer.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        require(!paused(), "InternToken: token transfer while paused");

        if (from == address(0) || to == address(0)) {
            super._update(from, to, value);
            return;
        }

        require(!blocklist[from], "InternToken: sender is blocked");
        require(!blocklist[to], "InternToken: recipient is blocked");
        require(value > 0, "InternToken: transfer amount must be greater than 0");
        require(balanceOf(from) >= value, "InternToken: transfer amount exceeds balance");

        uint256 taxAmount = (value * 2) / 100; // 2% to treasury
        uint256 burnAmount = (value * 1) / 100; // 1% burned
        uint256 sendAmount = value - taxAmount - burnAmount;

        // Transfer tax to treasury
        super._update(from, treasuryWallet, taxAmount);
        emit TaxTransferred(from, treasuryWallet, taxAmount);

        // Burn tokens
        emit TokensBurned(from, burnAmount);
        super._burn(from, burnAmount);

        // Transfer remaining tokens to recipient
        super._update(from, to, sendAmount);
        emit TransferTokenAction(from, to, sendAmount);
    }

    /**
     * @dev Burns a specific amount of tokens from the caller.
     *
     * Requirements:
     * - `_amount` must be greater than 0.
     * - Caller must have at least `_amount` tokens.
     *
     * Emits a {TokensBurned} event.
     *
     * @param _amount The number of tokens to burn.
     */
    function burn(uint256 _amount) public virtual override {
        require(_amount > 0, "InternToken: burn amount must be greater than 0");
        require(balanceOf(msg.sender) >= _amount, "InternToken: burn amount exceeds balance");
        super._burn(msg.sender, _amount);
        emit TokensBurned(msg.sender, _amount);
    }
}