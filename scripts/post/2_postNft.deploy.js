// 2. Deploy Post NFT contract
// npx hardhat run scripts/post/2_postNft.deploy.js --network arbitrum

const contractName = "PostNft";

const defaultPrice = ethers.utils.parseEther("0.0002");
const metadataAddress = "";
const collectionName = "AlwaysLiquid Posts";
const collectionSymbol = "ALPOST";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(defaultPrice, metadataAddress, collectionName, collectionSymbol);
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + defaultPrice + '" ' + metadataAddress + ' "' + collectionName + '" "' + collectionSymbol + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });