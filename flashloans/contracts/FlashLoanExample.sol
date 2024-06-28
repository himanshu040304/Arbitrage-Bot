// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;
pragma experimental ABIEncoderV2;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/interfaces/IAggregationRouterV5.sol";


contract FlashLoanExample is FlashLoanReceiverBase, Ownable {
    event Log(address[] assets, uint256[] amounts);

    IAggregationRouterV5 router;

    constructor(
        IPoolAddressesProvider provider,
        address aggregationRouter,
        address initialOwner
    ) FlashLoanReceiverBase(provider) Ownable (initialOwner){
        router = IAggregationRouterV5(aggregationRouter);
    }

    function createFlashLoan(
        address[] calldata assets, 
        uint256[] calldata amounts, 
        bytes calldata params
        ) external {
        address receiver = address(this);
        address onBehalfOf = address(this);
        uint16 referralCode = 0;

        uint256 len = assets.length; 
        uint256[] memory modes = new uint256[](len);
        POOL.flashLoan(receiver, assets, amounts, modes, onBehalfOf, params, referralCode);
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address,
        bytes calldata params
    ) external returns (bool) {

        uint256 len = assets.length;

        bytes[] memory parameters = abi.decode(params, (bytes[]));

        for(uint16 i = 0; i<len; i++){
            (
                IAggregationExecutor executor, 
                IAggregationRouterV5.SwapDescription memory desc,
                bytes memory permit,
                bytes memory data
            ) = abi.decode(
                parameters[i], 
                (
                    IAggregationExecutor,
                    IAggregationRouterV5.SwapDescription,
                    bytes,
                    bytes
                )
            );
            desc.dstReceiver = payable(address(this));
            router.swap(executor, desc, permit, data);
        }
        
        uint256[] memory amountOwing = new uint256[](len);
        for(uint16 i=0; i<len; i++){
            amountOwing[i] = amounts[i] - premiums[i];
            IERC20(assets[i]).approve(address(POOL), amountOwing[i]);
        }
        emit Log(assets, amountOwing);
        return true;
    }

    function withdraw(address[] calldata tokens) public onlyOwner returns (bool) {
        for(uint256 i=0; i<tokens.length; i++){
            IERC20 asset = IERC20(tokens[i]);
            uint256 amount = asset.balanceOf(address(this));
            asset.transfer(msg.sender, amount);
        }
        return true;
    }
}
