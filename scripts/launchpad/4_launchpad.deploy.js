// 4. Deploy Launchpad contract.
// npx hardhat run scripts/launchpad/4_launchpad.deploy.js --network arbitrumGoerli

const contractName = "Launchpad";

const metadataAddress = "0xdeBc51Cc932Aa24fb9bB5D062d73E5B2E933626D";
const mintingFeeReceiver = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d";
const statsMiddlewareAddress = "0x249f1172Ebd8686386a5C0Ee704378B85acD0627";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const price = ethers.utils.parseEther("0.00002"); // price for creating a new NFT collection

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    metadataAddress,
    mintingFeeReceiver,
    statsMiddlewareAddress,
    mintingFeePercentage,
    price
  );
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  // create a stats middleware contract instance
  const statsMiddlewareContract = await ethers.getContractFactory("StatsMiddleware");
  const statsMiddlewareInstance = await statsMiddlewareContract.attach(statsMiddlewareAddress);

  // set the launchpad contract address as writer in the stats middleware contract (addWriter function)
  console.log("Adding " + contractName + " contract as writer in the stats middleware contract...");
  await statsMiddlewareInstance.addWriter(instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + metadataAddress + " " + mintingFeeReceiver + " " + statsMiddlewareAddress + ' "' + mintingFeePercentage + '" "' + price + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });