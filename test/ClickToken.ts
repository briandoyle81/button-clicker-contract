import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("ClickToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployClickTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, secondAccount, thirdAccount] = await hre.viem.getWalletClients();

    const clickToken = await hre.viem.deployContract("ClickToken");

    const publicClient = await hre.viem.getPublicClient();

    return {
      clickToken,
      owner,
      otherAccount,
      secondAccount,
      thirdAccount,
      publicClient,
    };
  }

  describe("Testing", function () {
    it("Should get an empty result with no player", async function () {
      const { clickToken } = await loadFixture(deployClickTokenFixture);

      expect((await clickToken.read.getAllScores()).length).to.equal(0);
    });

    it("Should get 0 for a player that has not clicked", async function () {
      const { clickToken, owner } = await loadFixture(deployClickTokenFixture);

      expect((await clickToken.read.getScore([owner.account.address]))).to.equal(0n);
    });

    it("Should get 1 for a player that has clicked", async function () {
      const { clickToken, owner } = await loadFixture(
        deployClickTokenFixture
      );

      // Call mint from the owner to simulate a click
      await clickToken.write.mintTo([owner.account.address]);

      expect((await clickToken.read.getScore([owner.account.address]))).to.equal(parseEther("1"));
    });

    it("Should get 1 for a player that is not the owner", async function () {
      const { clickToken, otherAccount } = await loadFixture(
        deployClickTokenFixture
      );

      const clickTokenOtherAccount = await hre.viem.getContractAt(
        "ClickToken",
        clickToken.address,
        { client: { wallet: otherAccount } }
      );

      // Call mint from the owner to simulate a click
      await clickTokenOtherAccount.write.mintTo([otherAccount.account.address]);

      expect((await clickTokenOtherAccount.read.getScore([otherAccount.account.address]))).to.equal(parseEther("1"));
    });
    it("Should correctly update the score when a player transfers tokens", async function () {
      const { clickToken, owner, otherAccount } = await loadFixture(
        deployClickTokenFixture
      );

      // Call mint from the owner to simulate a click
      await clickToken.write.mintTo([owner.account.address]);

      // Transfer the tokens to another account
      await clickToken.write.transfer([otherAccount.account.address, parseEther("1")]);

      expect((await clickToken.read.getScore([owner.account.address]))).to.equal(0n);
      expect((await clickToken.read.getScore([otherAccount.account.address]))).to.equal(parseEther("1"));
    });
    it("Should correctly update the score when a player approves and transfers tokens", async function () {
      const { clickToken, owner, otherAccount } = await loadFixture(
        deployClickTokenFixture
      );

      // Set up the other account
      const clickTokenOtherAccount = await hre.viem.getContractAt(
        "ClickToken",
        clickToken.address,
        { client: { wallet: otherAccount } }
      );

      // Call mint from the owner to simulate a click
      await clickToken.write.mintTo([owner.account.address]);

      // Approve the other account to transfer the tokens
      await clickToken.write.approve([otherAccount.account.address, parseEther("1")]);

      // Transfer the tokens to another account
      await clickTokenOtherAccount.write.transferFrom([owner.account.address, otherAccount.account.address, parseEther("1")]);

      expect((await clickToken.read.getScore([owner.account.address]))).to.equal(0n);
      expect((await clickToken.read.getScore([otherAccount.account.address]))).to.equal(parseEther("1"));
    });
    it("Should allow several players to play and mint 10 tokens each", async function () {
      const { clickToken, owner, otherAccount, secondAccount, thirdAccount } = await loadFixture(
        deployClickTokenFixture
      );

      // Set up the other three accounts
      const clickTokenOtherAccount = await hre.viem.getContractAt(
        "ClickToken",
        clickToken.address,
        { client: { wallet: otherAccount } }
      );
      const clickTokenSecondAccount = await hre.viem.getContractAt(
        "ClickToken",
        clickToken.address,
        { client: { wallet: secondAccount } }
      );
      const clickTokenThirdAccount = await hre.viem.getContractAt(
        "ClickToken",
        clickToken.address,
        { client: { wallet: thirdAccount } }
      );

      // Call mint 10x from each of the 4 accounts
      for (let i = 0; i < 10; i++) {
        console.log("Minting", i);
        await clickToken.write.mintTo([owner.account.address]);
        await clickTokenOtherAccount.write.mintTo([otherAccount.account.address]);
        await clickTokenSecondAccount.write.mintTo([secondAccount.account.address]);
        await clickTokenThirdAccount.write.mintTo([thirdAccount.account.address]);
      }

      expect((await clickToken.read.getScore([owner.account.address]))).to.equal(parseEther("10"));
      expect((await clickToken.read.getScore([otherAccount.account.address]))).to.equal(parseEther("10"));
      expect((await clickToken.read.getScore([secondAccount.account.address]))).to.equal(parseEther("10"));
      expect((await clickToken.read.getScore([thirdAccount.account.address]))).to.equal(parseEther("10"));

      expect((await clickToken.read.getAllScores()).length).to.equal(4);

      expect((await clickToken.read.getAllScores())[0].value).to.equal(parseEther("10"));
      expect((await clickToken.read.getAllScores())[1].value).to.equal(parseEther("10"));
      expect((await clickToken.read.getAllScores())[2].value).to.equal(parseEther("10"));
      expect((await clickToken.read.getAllScores())[3].value).to.equal(parseEther("10"));

    });
  });
});
