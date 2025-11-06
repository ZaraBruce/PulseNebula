import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("PulseNebulaHub", {
    contract: "PulseNebulaHub",
    from: deployer,
    log: true,
    autoMine: true,
  });
};

export default func;
func.tags = ["PulseNebulaHub"];

