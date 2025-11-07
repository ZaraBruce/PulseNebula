import { expect } from "chai";
import { ethers } from "hardhat";

describe("PulseNebulaHub", function () {
  it("should deploy with zero samples", async () => {
    const [deployer] = await ethers.getSigners();
    const PulseNebulaHub = await ethers.getContractFactory("PulseNebulaHub", deployer);
    const pulseNebula = await PulseNebulaHub.deploy();
    await pulseNebula.waitForDeployment();

    expect(await pulseNebula.totalSamples()).to.equal(0n);
  });
});

