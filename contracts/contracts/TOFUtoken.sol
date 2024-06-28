// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.0.1/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@5.0.1/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts@5.0.1/access/Ownable.sol";
import "@openzeppelin/contracts@5.0.1/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts@5.0.1/token/ERC20/extensions/ERC20FlashMint.sol";

contract TOFUtoken is ERC20, ERC20Burnable, Ownable, ERC20Permit, ERC20FlashMint {
    constructor(address initialOwner)
        ERC20("TOFUtoken", "TOFU")
        Ownable(initialOwner)
        ERC20Permit("TOFUtoken")
    {
        _mint(msg.sender, 10000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    function burn(address from,uint256 amount) public onlyOwner {
        _burn(from,amount);
    }
}