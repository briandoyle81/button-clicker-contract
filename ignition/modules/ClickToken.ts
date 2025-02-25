// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ClickerModule = buildModule("ClickTokenModule", (m) => {

  const clickToken = m.contract("ClickToken");

  return { clickToken };
});

export default ClickerModule;
