const hre = require("hardhat");

async function main() {
  const registryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // tu dirección
  const registry = await hre.ethers.getContractAt("SignatureRegistry", registryAddress);

  const [signer] = await hre.ethers.getSigners();
  console.log("Consultando firma de:", signer.address);

  const hash = await registry.getSignature(signer.address);
  console.log("Último hash de firma:", hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
