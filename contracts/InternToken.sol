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

    function setTreasuryWallet(address _treasuryWallet) public onlyOwner {
        require(_treasuryWallet != address(0), "InternToken: treasury wallet is the zero address");
        require(_treasuryWallet != address(this), "InternToken: treasury wallet cannot be the contract itself");

        treasuryWallet = _treasuryWallet;
        
    }

    /**
     * @dev Mints `amount` tokens and assigns them to `to`, increasing the total supply.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `amount` must be greater than 0.
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
    
    // function transferToTreasury(address _from, uint256 _amount) private {
    //     require(treasuryWallet != address(0), "Treasury wallet not set");
    //     require(_amount > 0, "InternToken: transfer amount must be greater than 0");
    //     require(balanceOf(_from) >= _amount, "InternToken: transfer amount exceeds balance");
    //     super._transfer(_from, treasuryWallet, _amount);
    // }
    
    //     function _update(
    //         address from,
    //         address to,
    //         uint256 amount
    //     ) internal override(ERC20, ERC20Pausable) {
    //         require(to != address(0), "InternToken: transfer to the zero address");
    //         require(amount > 0, "InternToken: transfer amount must be greater than 0");
    //         require(balanceOf(from) >= amount, "InternToken: transfer amount exceeds balance");
    //         require(!paused(), "InternToken: Transfers are paused");

    //         uint256 taxAmount = (amount * 2) / 100;   // 2% to treasury
    //         uint256 burnAmount = (amount * 1) / 100;    // 1% burned
    //         uint256 sendAmount = amount - taxAmount - burnAmount;

    //         // Transfer tax to treasury
    //         super._update(from, treasuryWallet, taxAmount);
    //         emit TaxTransferred(from, treasuryWallet, taxAmount);

    //         // Burn tokens
    //         _burn(from, burnAmount);
    //         emit TokensBurned(from, burnAmount);

    //         // Transfer remaining tokens to recipient
    //         super._update(from, to, sendAmount);
    // }



    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        //require(to != address(0), "InternToken: transfer to the zero address");
        require(value > 0, "InternToken: transfer amount must be greater than 0");
        //require(balanceOf(from) >= value, "InternToken: transfer amount exceeds balance");
        require(!paused(), "InternToken: Transfers are paused");
         if (from == address(0) || to == address(0)) {
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
