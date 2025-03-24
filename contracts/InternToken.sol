// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TokenEvents} from "./Events.sol";

contract InternToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit, TokenEvents {
    uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18;
    address public treasuryWallet;
    constructor(address recipient, address initialOwner)
        ERC20("InternToken", "INT")
        Ownable(initialOwner)
        ERC20Permit("InternToken")
    {
        _mint(recipient, 500000 * 10 ** 18);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Sets the treasury wallet address.
     * Can only be called by the current owner.
     * @param _treasuryWallet The address of the new treasury wallet.
     * Requirements:
     * - `_treasuryWallet` cannot be the zero address.
     * - `_treasuryWallet` cannot be the contract address itself.
     */
    function setTreasuryWallet(address _treasuryWallet) public onlyOwner {
        require(_treasuryWallet != address(0), "InternToken: treasury wallet is the zero address");
        require(_treasuryWallet != address(this), "InternToken: treasury wallet is the contract address");
        treasuryWallet = _treasuryWallet;
    }
    
    /**
     * @dev Mapping tracking addresses that are blocked.
     * The status of an address can be true (blocked) or false (not blocked).
     */
    mapping(address => bool) public blocklist;
    /**
     * @notice Blocks a specific address.
     * @dev This function marks the provided address as blocked.
     * Only the contract owner can call this function.
     *
     * @param _address The address to be blocked.
     */
    function blockAddress(address _address) public onlyOwner {
        blocklist[_address] = true;
    }
    /**
     * @notice Unblocks a specific address.
     * @dev This function marks the provided address as not blocked.
     * Only the contract owner can call this function.
     *
     * @param _address The address to be unblocked.
     */
    
    function unblockAddress(address _address) public onlyOwner {
        blocklist[_address] = false;
    }

    /**
     * @dev Mints new tokens.
     * - The total supply after minting must not exceed `MAX_SUPPLY`.
     *
     * Emits a {Mint} event.
     *
     * @param to The address to which the minted tokens will be assigned.
     * @param amount The number of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "InternToken: mint to the zero address");
        
        require(amount > 0, "InternToken: mint amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "InternToken: mint amount exceeds total supply");
         emit Mint(to, amount);
        _mint(to, amount);
    }
    

   
    /**
     * @notice Updates token balances during a transfer with additional tokenomics.
     * @dev This internal function overrides the _update function from both ERC20 and ERC20Pausable.
     * It performs multiple checks: ensuring the contract is not paused, validating that neither the sender nor the recipient
     * is the zero address, confirming that neither account is blocklisted, verifying that the transfer value is greater than zero,
     * and checking that the sender has sufficient balance.
     *
     * For transfers not involving minting or burning (i.e., when neither 'from' nor 'to' is the zero address), the function applies:
     * - A 2% tax (transferred to the treasury wallet).
     * - A 1% burn of the tokens.
     * The recipient receives the remaining tokens.
     *
     * Special Case:
     * - If 'from' or 'to' is the zero address, the function defers to the parent implementation without applying the tax or burn.
     *
     * Events Emitted:
     * - TaxTransferred: when the tax amount is transferred to the treasury wallet.
     * - TokensBurned: when tokens are burned.
     *
     * @param from address sending tokens
     * @param to address receiving tokens
     * @param value total amount of tokens involved in the transfer
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        require(!paused(), "InternToken: token transfer while paused");
        require(to != address(0), "InternToken: transfer to the zero address");
        require(!blocklist[from], "InternToken: sender is blocked");
        require(!blocklist[to], "InternToken: recipient is blocked");
        require(value > 0, "InternToken: transfer amount must be greater than 0");
        require(balanceOf(from) >= value, "InternToken: transfer amount exceeds balance");
        if (from == address(0) || to == address(0)) 
        {
            super._update(from, to, value);
            return;
        }
        uint256 taxAmount = (value * 2) / 100;   // 2% to treasury
        uint256 burnAmount = (value * 1) / 100;    // 1% burned
        uint256 sendAmount = value - taxAmount - burnAmount;
        // Transfer tax to treasury
        super._update(from, treasuryWallet, taxAmount);
        emit TaxTransferred(from, treasuryWallet, taxAmount);

        // Burn tokens
        emit TokensBurned(from, burnAmount);
        super._update(from, to, sendAmount);
        super._update(from, address(0), burnAmount);

    }
}
