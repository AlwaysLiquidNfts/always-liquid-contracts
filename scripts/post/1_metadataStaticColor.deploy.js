// 1. Deploy metadata contract
// npx hardhat run scripts/post/1_metadataStaticColor.deploy.js --network arbitrumGoerli

const contractName = "PostMetadataStaticColor";

const colorCode = "#e4007b";
const mdName = "AlwaysLiquid Post";
const description = "AlwaysLiquid is a Social NFT Launchpad where NFTs are always liquid. Go visit https://alwaysliquid.com/ to learn more!";
const url = "https://testnet.alwaysliquid.com/post/";
const tldAddress = "";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(colorCode, mdName, description, url, tldAddress);
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + colorCode + '" "' + mdName + '" "' + description + '" "' + url + '" ' + tldAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });