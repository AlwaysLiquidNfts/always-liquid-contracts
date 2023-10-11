// 5. Deploy mock/test AlwaysLiquidNft contract so that others created through factory can get auto-verified.
// npx hardhat run scripts/launchpad/5_mockNft.deploy.js --network base

const contractName = "AlwaysLiquidNft";

const factoryAddress = "";
const metadataAddress = "";
const mintingFeeReceiver = "";
const cName = "Test collection";
const cSymbol = "TEST";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const ratio = ethers.utils.parseEther("4200");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    factoryAddress,
    metadataAddress,
    mintingFeeReceiver,
    cName,
    cSymbol,
    mintingFeePercentage,
    ratio
  );
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + factoryAddress + " " + metadataAddress + " " + mintingFeeReceiver + ' "' + cName + '" "' + cSymbol + '" "' + mintingFeePercentage + '" "' + ratio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });