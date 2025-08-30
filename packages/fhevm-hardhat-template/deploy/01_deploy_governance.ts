import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Despliega:
 * 1) MyToken (ERC20Votes)
 * 2) TimelockController
 * 3) MyGovernor (usas el .sol que ya tenés)
 *
 * Post-setup:
 * - Delegación de votos al deployer (para tener poder de voto).
 * - Asignación de roles del Timelock (Governor como PROPOSER; cualquiera EXECUTOR).
 * - Timelock se auto-administra; el deployer renuncia al admin.
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("== Despliegue de Gobernanza ==");

  // 1) Token con votos
  const token = await deploy("MyToken", {
    from: deployer,
    log: true,
  });
  log(`MyToken => ${token.address}`);

  // Instancia del token para delegación de votos
  const tokenCtr = await ethers.getContractAt("MyToken", token.address);
  const currentDelegate = await tokenCtr.delegates(deployer).catch(() => ethers.constants.AddressZero);
  if (currentDelegate === ethers.constants.AddressZero) {
    const tx = await tokenCtr.connect((await ethers.getSigners())[0]).delegate(deployer);
    await tx.wait();
    log(`Delegados los votos de ${deployer} a sí mismo`);
  }

  // 2) TimelockController
  const minDelay = 3600; // 1 hora (ajustable)
  const proposers: string[] = []; // se añadirán luego (Governor)
  const executors: string[] = ["*"]; // cualquiera puede ejecutar
  const timelock = await deploy("TimelockController", {
    from: deployer,
    args: [minDelay, proposers, executors],
    log: true,
  });
  log(`TimelockController => ${timelock.address}`);

  // 3) MyGovernor (tu contrato ya existente)
  // Constructor esperado: (ERC20Votes token, TimelockController timelock)
  const governor = await deploy("MyGovernor", {
    from: deployer,
    args: [token.address, timelock.address],
    log: true,
  });
  log(`MyGovernor => ${governor.address}`);

  // --- Post configuración de roles del Timelock ---
  const timelockCtr = await ethers.getContractAt("TimelockController", timelock.address);

  const PROPOSER_ROLE = await timelockCtr.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelockCtr.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelockCtr.CANCELLER_ROLE().catch(() => ethers.constants.HashZero); // puede no existir en versiones viejas
  const DEFAULT_ADMIN_ROLE = await timelockCtr.DEFAULT_ADMIN_ROLE();

  // Governor como PROPOSER del timelock
  if (!(await timelockCtr.hasRole(PROPOSER_ROLE, governor.address))) {
    const tx = await timelockCtr.grantRole(PROPOSER_ROLE, governor.address);
    await tx.wait();
    log(`Grant PROPOSER_ROLE a Governor (${governor.address})`);
  }

  // Cualquiera puede EXECUTAR (AddressZero o "*")
  if (!(await timelockCtr.hasRole(EXECUTOR_ROLE, ethers.constants.AddressZero))) {
    const tx = await timelockCtr.grantRole(EXECUTOR_ROLE, ethers.constants.AddressZero);
    await tx.wait();
    log("Grant EXECUTOR_ROLE a cualquiera (AddressZero)");
  }

  // Opcional: que el deployer pueda cancelar (si el Timelock lo soporta)
  if (CANCELLER_ROLE !== ethers.constants.HashZero) {
    if (!(await timelockCtr.hasRole(CANCELLER_ROLE, deployer))) {
      const tx = await timelockCtr.grantRole(CANCELLER_ROLE, deployer);
      await tx.wait();
      log(`Grant CANCELLER_ROLE a deployer (${deployer})`);
    }
  }

  // Timelock se auto-administra y el deployer renuncia al admin
  // (Patrón recomendado para que no exista clave “dueña” del timelock)
  if (!(await timelockCtr.hasRole(DEFAULT_ADMIN_ROLE, timelock.address))) {
    const tx = await timelockCtr.grantRole(DEFAULT_ADMIN_ROLE, timelock.address);
    await tx.wait();
    log("Grant DEFAULT_ADMIN_ROLE al propio Timelock");
  }

  if (await timelockCtr.hasRole(DEFAULT_ADMIN_ROLE, deployer)) {
    const tx = await timelockCtr.revokeRole(DEFAULT_ADMIN_ROLE, deployer);
    await tx.wait();
    log("Revoke DEFAULT_ADMIN_ROLE del deployer");
  }

  log("== Gobernanza desplegada y configurada ==");
};

export default func;
func.tags = ["governance"];
