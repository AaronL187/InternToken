// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract InternToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
    uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18;
    event Mint(address indexed to, uint256 amount);
    constructor(address recipient, address initialOwner)
        ERC20("InternToken", "INT")
        Ownable(initialOwner)
        ERC20Permit("InternToken")
    {
        _mint(recipient, 500000 * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
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
        _mint(to, amount);
        emit Mint(to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
