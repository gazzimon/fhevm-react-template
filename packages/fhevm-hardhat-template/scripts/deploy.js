const hre = require("hardhat");

async function main() {
  const SignatureRegistry = await hre.ethers.getContractFactory("SignatureRegistry");
  const registry = await SignatureRegistry.deploy();

  // En ethers v5: .deployed()
  await registry.deployed();

  console.log("✅ SignatureRegistry desplegado en:", registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
