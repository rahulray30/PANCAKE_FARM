import { expect } from "chai";
import { ethers } from "hardhat";


import {
  CakeToken,
  CakeToken__factory,
  SyrupBar,
  SyrupBar__factory,
  MasterChef,
  MasterChef__factory,
  BEP20,
  BEP20__factory

} from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { mineBlocks, expandTo18Decimals, expandTo6Decimals } from "./utilities/utilities";


describe("Pancake-Farm-Masterchef", function () {

  let cakeToken: CakeToken;
  let syrupBar: SyrupBar;
  let masterChef: MasterChef;
  let owner: SignerWithAddress;
  let signers: SignerWithAddress[];
  let Bep20Token: BEP20;


  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    cakeToken = await new CakeToken__factory(owner).deploy();
    //console.log("CakeToken address: " + cakeToken.address);

    syrupBar = await new SyrupBar__factory(owner).deploy(cakeToken.address);
    //console.log("SyrupBar address: " + syrupBar.address);

    masterChef = await new MasterChef__factory(owner).deploy(cakeToken.address, syrupBar.address, owner.address,
      100, 0);
    //console.log("Masterchef address: " + masterChef.address);


    //approve

    let TransferOwnership_Cake = await cakeToken.transferOwnership(masterChef.address);
    let transferOwnership_SyrupBar = await syrupBar.transferOwnership(masterChef.address);

    //console.log("Cake Token new owner: " + await cakeToken.owner());

    let approveCakeToken = await cakeToken.approve(masterChef.address, expandTo18Decimals(1000));
    let approveSyrupBar = await syrupBar.approve(masterChef.address, expandTo18Decimals(1000));

  })

  it("this is masterchef lp add to the pool function ", async () => {

    let LP_Token = await new BEP20__factory(owner).deploy("LP_Token", "LPT");

    //await LP_Token.approve(masterChef.address, expandTo18Decimals(100));

    console.log("LP Token address: " + LP_Token.address);
    let initial_poolLength = Number(await masterChef.poolLength());
    await masterChef.add(50, LP_Token.address, true);    // Add a new lp to the pool. Can only be called by the owner.

    console.log(await masterChef.poolInfo(1));
    let final_poolLength = Number(await masterChef.poolLength());
    console.log(final_poolLength);

    expect(final_poolLength).to.be.greaterThan((initial_poolLength));

  })

  it("updating the given pool's allocation point", async () => {
    let LP_Token = await new BEP20__factory(owner).deploy("LP_Token", "LPT");
    await masterChef.add(50, LP_Token.address, true);    // Add a new lp to the pool. Can only be called by the owner.
    const pid = Number(await masterChef.poolLength()) - 1;

    let initial_alpoint = (await masterChef.poolInfo(pid)).allocPoint;
    console.log("Initial allocation point = " + initial_alpoint);

    await masterChef.set(pid, 100, true); // calling the set function
    let after_alpoint = (await masterChef.poolInfo(pid)).allocPoint;
    console.log("Allocation point after updation = " + after_alpoint);

  })
  it("Deposit LP token to Masterchef for cake allocation ", async () => {
    console.log("-------------------------");
    let LP_Token = await new BEP20__factory(owner).deploy("LP_Token", "LPT");
    let Token_owner = await LP_Token.getOwner();
    let Token_mint = await LP_Token.mint(expandTo18Decimals(1000));

    //  let lptoken_totalsupply = await LP_Token.totalSupply();
    //  console.log("Total supply of Lp token "+ lptoken_totalsupply);

    await masterChef.add(50, LP_Token.address, true);    // Add a new lp to the pool. Can only be called by the owner.
    const pid = Number(await masterChef.poolLength()) - 1;

    let approveLPToken = await LP_Token.approve(masterChef.address, expandTo18Decimals(100));
    console.log("LP Token approved");
    console.log(await LP_Token.balanceOf(Token_owner));
    await masterChef.deposit(pid, expandTo18Decimals(100));

    console.log("LP Token deposited");
    console.log(await LP_Token.balanceOf(Token_owner));

    // let pendingCake = await masterChef.pendingCake(pid, owner.address);
    // console.log(pendingCake);

  })
  it("Withdraw LP tokens from MasterChef", async () => {
    console.log("-------------------------");
    Bep20Token = await new BEP20__factory(owner).deploy("LP_Token", "LPT");

    let Token_mint = await Bep20Token.connect(owner).mint(expandTo18Decimals(1000));
    let Token_owner = await Bep20Token.getOwner();

    //console.log(Token_owner, + " "+ owner.address);

    await masterChef.connect(owner).add(50, Bep20Token.address, true);    // Add a new lp to the pool. Can only be called by the owner.
    const pid = Number(await masterChef.poolLength()) - 1;

    let approveLPToken = await Bep20Token.connect(owner).approve(masterChef.address, expandTo18Decimals(100));
    console.log("LP Token approved");
    console.log("Balance of Token owner before deposit " + await Bep20Token.balanceOf(owner.address));
    await masterChef.connect(owner).deposit(pid, expandTo18Decimals(100));

    console.log("Balance of Token owner after deposit " + await Bep20Token.balanceOf(owner.address));

    await masterChef.connect(owner).withdraw(1, expandTo18Decimals(10));

    console.log("Balance of Token owner after withdrawl " + await Bep20Token.balanceOf(owner.address));

  })
  it("Cake Earned by depositing LP Token", async () => {

    Bep20Token = await new BEP20__factory(owner).deploy("LP_Token", "LPT");

    let Token_mint = await Bep20Token.connect(owner).mint(expandTo18Decimals(1000));

    const add = await masterChef.connect(owner).add(100, Bep20Token.address, true);

    console.log(add.blockNumber, "........block number.......");
    console.log(await Bep20Token.balanceOf(owner.address));
    // const beforeDepositLP =await Bep20.balanceOf(owner.address);
    await Bep20Token.connect(owner).approve(masterChef.address, expandTo18Decimals(1000));

    const bal1 = await cakeToken.connect(owner).balanceOf(owner.address);
    console.log("Initial balance of cake Token " + bal1);

    const deposit = await masterChef.connect(owner).deposit(1, expandTo18Decimals(100));

    //mine the block
    const mining = await mineBlocks(ethers.provider, 120);
    const add1 = await masterChef.connect(owner).add(100, Bep20Token.address, true);
    //  console.log(add1);
    console.log(add1.blockNumber, "........block number.......");
    //  const mine1 = await mineBlocks(ethers.provider,120);

    const add2 = await masterChef.connect(owner).add(100, Bep20Token.address, true);
     console.log("------>>>");
    console.log(add2.blockNumber, "........block number.......");

    const freeCake = await masterChef.pendingCake(1, owner.address);
    console.log(freeCake, "this is the cake minted for the investor");

    await masterChef.connect(owner).deposit(1, expandTo18Decimals(200));
    await mineBlocks(ethers.provider, 120);


    const freeCake2 = await masterChef.pendingCake(1, owner.address);
    console.log(freeCake2, "this is the cake minted for the investor");

    const DepositDetail = await masterChef.userInfo(1, owner.address);
    console.log(DepositDetail, "this is the user deposit");

    const bal2 = await cakeToken.connect(owner).balanceOf(owner.address);
    console.log(bal2, "Balance 2");

    expect(Number(bal1)).to.lessThan(Number(bal2));
    // await masterChef.withdraw(1,allocUserAmount);
  })

  it("Emergency withdrawl", async () => {
    console.log("-------------------------");
    //creating a token and deploying it
    Bep20Token = await new BEP20__factory(owner).deploy("LP_Token", "LPT");

    //Token minting
    let Token_mint = await Bep20Token.connect(owner).mint(expandTo18Decimals(1000));
    let Token_owner = await Bep20Token.getOwner();

    //Approve 
    let approveLPToken = await Bep20Token.connect(owner).approve(masterChef.address, expandTo18Decimals(100));
    const initialtotalBalance = await Bep20Token.balanceOf(owner.address);
    console.log("Balance of Token owner before deposit " + initialtotalBalance);

    // Add a new lp to the pool
    await masterChef.connect(owner).add(50, Bep20Token.address, true);
    const pid = Number(await masterChef.poolLength()) - 1;

    //Deposit Token to pool/farm
    await masterChef.connect(owner).deposit(pid, expandTo18Decimals(100));
    console.log("Balance of Token owner after deposit " + await Bep20Token.balanceOf(owner.address));

    //Calling Emergency Withdraw function
    await masterChef.connect(owner).emergencyWithdraw(pid);

    const totalBalanceAfterWithdrawl = await Bep20Token.balanceOf(owner.address);
    console.log("Balance of Token owner after emergency withdrawl " + totalBalanceAfterWithdrawl);
    
    expect(totalBalanceAfterWithdrawl).to.be.equal(initialtotalBalance);

  })

  it("Staking CAKE Tokens in Masterchef", async () => {

  })


});
