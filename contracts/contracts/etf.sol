// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

contract etfAlgo{
    struct asset{
        // uint id;
        uint amount;
    }
    mapping(address=>asset) assets;
    // uint totalValue;
    uint totalNoOfAssets;
    address owner;
    event ratiosRevised(uint assets);
    constructor(
        address _owner
        // uint total
    ){
        owner=_owner;
        // totalValue=total;
    }
    
    modifier onlyOwner{
        require(msg.sender==owner,"Only Owner can call this function");
        _;
    }

    function deposit(address name, uint amount) public onlyOwner{
        // uint x=assets[name].amount;
        addNewAsset(name);
        assets[name].amount+=amount;
    
    }

    function withdraw(address name, uint amount) public onlyOwner{
        require(assets[name].amount>=amount,"NOT ENOUGH AMOUNT IN THE STOCK");
        assets[name].amount-=amount;
        if(assets[name].amount==0){
            totalNoOfAssets--;
        }
    }

    function addNewAsset(address name) public onlyOwner{
        require(assets[name].amount==0,"ASSET ALREADY EXISTS");
        totalNoOfAssets++;
    }

    function currentAmount(address name) public view returns(uint){
        return assets[name].amount;
    }

    // function total_Value() public view returns(uint){
    //     return totalValue;
    // }

    function totalNoofAssets() public view returns(uint){
        return totalNoOfAssets;
    }

}