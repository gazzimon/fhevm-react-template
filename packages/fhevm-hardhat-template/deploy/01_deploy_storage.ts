import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SignatureRegistry", {
    from: deployer,
    args: [], // acá agregás parámetros si tu constructor necesita
    log: true,
  });
};

export default func;
func.tags = ["SignatureRegistry"];
