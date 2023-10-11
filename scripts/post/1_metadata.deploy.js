// 1. Deploy metadata contract
// npx hardhat run scripts/post/1_metadata.deploy.js --network arbitrumGoerli

const contractName = "PostMetadata";

const mdName = "AlwaysLiquid Post";
const description = "AlwaysLiquid is a Social NFT Launchpad where NFTs are always liquid. Go visit alwaysliquid.com to learn more!";
const url = "testnet.alwaysliquid.com/post/";
const tldAddress = "0x578923A40977dB36Ce9a20cce2d0A75D191e6D53";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(mdName, "description", "url", tldAddress);
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  const tx1 = await instance.changeDescription(description);
  await tx1.wait();

  const tx2 = await instance.changeUrl(url);
  await tx2.wait();

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + mdName + '" "description" "url" ' + tldAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });