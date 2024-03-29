// 2. Deploy StatsMiddleware contract.
// npx hardhat run scripts/launchpad/2_statsMiddleware.deploy.js --network arbitrumGoerli

const contractName = "StatsMiddleware";

const launchpadStatsAddress = "0x9f48c192561f3A6f0efeeE5Fce00Fd9788675eF8";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy();
  await instance.deployed();

  console.log(contractName + " contract address:", instance.address);

  // set launchpad stats address (setStatsAddress)
  console.log("Setting launchpad stats address...");
  const tx1 = await instance.setStatsAddress(launchpadStatsAddress);
  await tx1.wait();
  
  // create a LaunchpadStats contract instance
  const launchpadStats = await ethers.getContractAt("LaunchpadStats", launchpadStatsAddress);

  // set middleware address (setStatsWriterAddress)
  console.log("Setting middleware address...");
  const tx2 = await launchpadStats.setStatsWriterAddress(instance.address);
  await tx2.wait();

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });