// npx hardhat run scripts/activity-points/activityPoints.deploy.js --network arbitrumGoerli

const contractName = "ActivityPoints";

const postStatsAddress = "0x498e0e6B245898c5E2dD0299d0456a8928F58ECC";
const nftStatsAddress = "0x9f48c192561f3A6f0efeeE5Fce00Fd9788675eF8"; // NFT Launchpad stats
const tldStatsAddress = ethers.constants.AddressZero;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    postStatsAddress,
    nftStatsAddress,
    tldStatsAddress
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + postStatsAddress + " " + nftStatsAddress + " " + tldStatsAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });