const { expect, assert } = require("chai");
const hre = require("hardhat");
const fetch = require('node-fetch');
require("dotenv").config({ path: ".env" });

const { AggregationRouter,
  WHALE,
  POOL_ADDRESS_PROVIDER,
  BNB,
  WBTC,
  WETH,
  DAI,
  USDC } = require("../config");

const RPC_URL = process.env.RPC_URL;
const API_KEY = process.env.ONEINCH_API_KEY;

const apiBaseUrl = "https://api.1inch.dev/swap/v6.0/1";
const headers = { headers: { Authorization: `Bearer ${API_KEY}`, accept: "application/json" } };

describe("Flash Loans", async function () {
  it("Should take a flash loan, make swaps and be able to return it", async function () {
    const FlashLoanExample = await hre.ethers.getContractFactory(
      "FlashLoanExample"
    );

    // Deploy our FlashLoanExample smart contract
    const flashLoanExample = await FlashLoanExample.deploy(
      POOL_ADDRESS_PROVIDER, 
      AggregationRouter,
      WHALE
    );
    await flashLoanExample.waitForDeployment();

    // Fetch the DAI smart contract
    const token1 = await hre.ethers.getContractAt("IERC20", DAI);
    const token2 = await hre.ethers.getContractAt("IERC20", USDC);
    const token3 = await hre.ethers.getContractAt("IERC20", WBTC);
    const token4 = await hre.ethers.getContractAt("IERC20", WETH);
    const token5 = await hre.ethers.getContractAt("IERC20", BNB);

    const signer = await hre.ethers.getImpersonatedSigner(WHALE); 
    const provider = new hre.ethers.JsonRpcProvider(RPC_URL);

    // Move 2000 DAI from DAI_WHALE to our contract by impersonating them
    const BALANCE_AMOUNT_DAI = hre.ethers.parseEther("2000");
    const SWAP_AMOUNT_DAI = hre.ethers.parseEther("10000");
    await token1
      .connect(signer)
      .transfer(flashLoanExample.target, BALANCE_AMOUNT_DAI); // Sends our contract 2000 DAI from the DAI_WHALE
    
    const BALANCE_AMOUNT_USDC = hre.ethers.parseEther("2000");
    const SWAP_AMOUNT_USDC = hre.ethers.parseEther("10000");
    await token2
      .connect(signer)
      .transfer(flashLoanExample.target, BALANCE_AMOUNT_USDC); // Sends our contract 2000 USDC from the DAI_WHALE
    
    const BALANCE_AMOUNT_WBTC = hre.ethers.parseEther("0.03");
    const SWAP_AMOUNT_WBTC = hre.ethers.parseEther("0.1");
    await token3
      .connect(signer)
      .transfer(flashLoanExample.target, BALANCE_AMOUNT_WBTC); // Sends our contract 2000 WBTC from the DAI_WHALE
    
    const BALANCE_AMOUNT_WETH = hre.ethers.parseEther("0.9");
    const SWAP_AMOUNT_WETH = hre.ethers.parseEther("3");
    await token4
      .connect(signer)
      .transfer(flashLoanExample.target, BALANCE_AMOUNT_WETH); // Sends our contract 2000 WETH from the DAI_WHALE

    const BALANCE_AMOUNT_BNB = hre.ethers.parseEther("3.11");
    const SWAP_AMOUNT_BNB = hre.ethers.parseEther("10");
    await token5
      .connect(signer)
      .transfer(flashLoanExample.target, BALANCE_AMOUNT_BNB); // Sends our contract 2000 BNB from the DAI_WHALE

    const assets = [DAI, WBTC, USDC, WETH, BNB];
    const amounts = [SWAP_AMOUNT_DAI, SWAP_AMOUNT_WBTC, SWAP_AMOUNT_USDC, SWAP_AMOUNT_WETH, SWAP_AMOUNT_BNB];
    
    // Set the parameters for the swap
    const swapParams1 = {
      src: DAI, 
      dst: WBTC, 
      amount: SWAP_AMOUNT_DAI, 
      from: flashLoanExample.target, 
      slippage: 1, 
      allowPartialFill: false, 
      disableEstimate: false,
    };
    const swapParams2 = {
      src: WBTC, 
      dst: USDC, 
      amount: SWAP_AMOUNT_WBTC, 
      from: flashLoanExample.target, 
      slippage: 1,  
      allowPartialFill: false,
      disableEstimate: false, 
    };
    const swapParams3 = {
      src: USDC, 
      dst: WETH, 
      amount: SWAP_AMOUNT_USDC, 
      from: flashLoanExample.target, 
      slippage: 1, 
      allowPartialFill: false, 
      disableEstimate: false, 
    };
    const swapParams4 = {
      src: WETH, 
      dst: BNB, 
      amount: SWAP_AMOUNT_WETH, 
      from: flashLoanExample.target, 
      slippage: 1,  
      allowPartialFill: false,
      disableEstimate: false, 
    };
    const swapParams5 = {
      src: BNB, 
      dst: DAI, 
      amount: SWAP_AMOUNT_BNB, 
      from: flashLoanExample.target, 
      slippage: 1, 
      disableEstimate: false, 
      allowPartialFill: false, 
    };
    
    // Construct full API request URL
    function apiRequestUrl(methodName, queryParams) {
      return apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString();
    }

    async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
      const url = apiRequestUrl("/approve/transaction", amount ? { tokenAddress, amount } : { tokenAddress });

      const transaction = await fetch(url, headers).then((res) => res.json());
      const gasLimit = await provider.estimateGas({
        ...transaction,
        from: WHALE
      });

      return {
        ...transaction,
        gas: gasLimit
      };
    }

    const transactionForSign1 = await buildTxForApproveTradeWithRouter(swapParams1.src, swapParams1.amount);
    const transactionForSign2 = await buildTxForApproveTradeWithRouter(swapParams2.src, swapParams2.amount);
    const transactionForSign3 = await buildTxForApproveTradeWithRouter(swapParams3.src, swapParams3.amount);
    const transactionForSign4 = await buildTxForApproveTradeWithRouter(swapParams4.src, swapParams4.amount);
    const transactionForSign5 = await buildTxForApproveTradeWithRouter(swapParams5.src, swapParams5.amount);

    console.log("Transaction for approve: ", transactionForSign1);
    console.log("Transaction for approve: ", transactionForSign2);
    console.log("Transaction for approve: ", transactionForSign3);
    console.log("Transaction for approve: ", transactionForSign4);
    console.log("Transaction for approve: ", transactionForSign5);

    const txHash1 = await signer.sendTransaction(transactionForSign1);
    const txHash2 = await signer.sendTransaction(transactionForSign2);
    const txHash3 = await signer.sendTransaction(transactionForSign3);
    const txHash4 = await signer.sendTransaction(transactionForSign4);
    const txHash5 = await signer.sendTransaction(transactionForSign5);

    console.log("Transaction hash: ", txHash1);
    console.log("Transaction hash: ", txHash2);
    console.log("Transaction hash: ", txHash3);
    console.log("Transaction hash: ", txHash4);
    console.log("Transaction hash: ", txHash5);

    await txHash1.wait();
    await txHash2.wait();
    await txHash3.wait();
    await txHash4.wait();
    await txHash5.wait();

    // Execute the swap
    const params = {};
    try {
      const response1 = await fetch(apiRequestUrl("/swap", swapParams1), headers);
      const response2 = await fetch(apiRequestUrl("/swap", swapParams2), headers);
      const response3 = await fetch(apiRequestUrl("/swap", swapParams3), headers);
      const response4 = await fetch(apiRequestUrl("/swap", swapParams4), headers);
      const response5 = await fetch(apiRequestUrl("/swap", swapParams5), headers);
      params = {response1, response2, response3, response4, response5};
    }catch (error) {
      console.error(error);
    }finally {
      console.log("Swap completed");
    }

    // Request and execute a flash loan from Aave
    const txn = await flashLoanExample.createFlashLoan(assets, amounts, params);
    await txn.wait();

    // By this point, we should have executed the flash loan and paid back (10,000 + premium) DAI to Aave
    // Let's check our contract's remaining DAI balance to see how much it has left
    const remainingBalance1 = await token1.balanceOf(flashLoanExample.target);
    const remainingBalance2 = await token2.balanceOf(flashLoanExample.target);
    const remainingBalance3 = await token3.balanceOf(flashLoanExample.target);
    const remainingBalance4 = await token4.balanceOf(flashLoanExample.target);
    const remainingBalance5 = await token5.balanceOf(flashLoanExample.target);

    // Our remaining balance should not be what we originally had, because we had to pay the premium and make swaps
    expect(remainingBalance1).to.not.equal(BALANCE_AMOUNT_DAI);
    expect(remainingBalance2).to.not.equal(BALANCE_AMOUNT_USDC);
    expect(remainingBalance3).to.not.equal(BALANCE_AMOUNT_WBTC);
    expect(remainingBalance4).to.not.equal(BALANCE_AMOUNT_WETH);
    expect(remainingBalance5).to.not.equal(BALANCE_AMOUNT_BNB);
  });
});