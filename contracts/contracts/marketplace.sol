// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/math/Math.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract BuySellMarketplace is Ownable, ReentrancyGuard {
    using Math for uint256;

    uint256 public TokenPrice;

    IERC20 TOFU;

    mapping(address => bool) adminsList;

    event TokenBought(
      address _buyerAddress,
      uint256 _amountBought
    );

    event TokenSold(
      address _sellerAddress,
      uint256 _amountSold
    );
    

    modifier adminOnly() {
        require(adminsList[msg.sender] == true, "You do not have rights");
        _;
    }

    constructor(address tokenAddress, uint256 price) Ownable(msg.sender) {
        require(tokenAddress!=address(0), "Token address not passed!");
        adminsList[msg.sender] = true;
        TokenPrice = price;
        TOFU = IERC20(tokenAddress);
    }

    function setPrice(uint256 _newPrice) external adminOnly {
        require(_newPrice > 0, 'Price is incorrect');
        TokenPrice = _newPrice;
    }

    /**
     * @dev buy Tokens from marketplace
     * ether will be charged from user account
     */
   


    function buyERC20(uint256 tokensAmount) external payable nonReentrant {
        require(msg.value >= TokenPrice * tokensAmount, "Incorrect amount");
        TOFU.approve(address(this), tokensAmount);
        TOFU.transferFrom(address(this), msg.sender, tokensAmount);
        emit TokenBought(msg.sender, tokensAmount);
    }

    /**
    * @notice Allow users to sell tokens for ETH
    */

    /**
     * requires you to pass the tokens to be sold in the denomination of 10**18;
     * separately from the ERC20 contract in the frontend
     */
    
    function sellErc20(uint256 tokenAmountToSell) external nonReentrant {
        // Check that the requested amount of tokens to sell is more than 0
        require(tokenAmountToSell > 0, "Specify an amount of token greater than zero");

        // Check that the user's token balance is enough to do the swap
        uint256 userBalance = TOFU.balanceOf(msg.sender);
        require(userBalance >= tokenAmountToSell, "Your balance is lower than the amount of tokens you want to sell");

        // Check that the Vendor's balance is enough to do the swap
        uint256 amountOfETHToTransfer = TokenPrice * tokenAmountToSell;
        uint256 ownerETHBalance = address(this).balance;
        require(ownerETHBalance >= amountOfETHToTransfer, "Vendor has not enough funds to accept the sell request");
        
        (bool sent) = TOFU.transferFrom(msg.sender, address(this), tokenAmountToSell);
        require(sent, "Failed to transfer tokens from user to vendor");


        (sent,) = msg.sender.call{value: amountOfETHToTransfer}("");
        require(sent, "Failed to send ETH to the user");
        emit TokenSold(msg.sender, tokenAmountToSell);
    }

    // TODO: Add withdraw all funds (token and ETH), add admin functions...
}