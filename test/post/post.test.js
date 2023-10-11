// npx hardhat test test/post/post.test.js

const { expect } = require("chai");

function calculateGasCosts(testName, receipt) {
  console.log(testName + " gasUsed: " + receipt.gasUsed);

  // coin prices in USD
  const matic = 1.5;
  const eth = 1500;
  
  const gasCostMatic = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("500", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostEthereum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("50", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostArbitrum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("1.25", "gwei")) * Number(receipt.gasUsed)), "ether");

  console.log(testName + " gas cost (Ethereum): $" + String(Number(gasCostEthereum)*eth));
  console.log(testName + " gas cost (Arbitrum): $" + String(Number(gasCostArbitrum)*eth));
  console.log(testName + " gas cost (Polygon): $" + String(Number(gasCostMatic)*matic));
}

describe("PostNft", function () {
  let postContract;
  let metadataContract;
  let minterContract;
  let mockPunkTldContract;

  let owner;
  let dao;
  let author;
  let user1;
  let user2;
  let dev;
  let referrer;

  const defaultAddressBalance = ethers.utils.parseEther("10000");

  const daoFee = 2000; // 20%
  const devFee = 1000; // 10%
  const referrerFee = 1000; // 10%

  const defaultPrice = ethers.utils.parseEther("1");
  const postId = "testjkdnw6t6dq37gg7";
  const textPreview = "This is a test post";
  const quantityOne = 1;
  const quantityMultiple = 3;

  const mdName = "AlwaysLiquid";
  const symbol = "ALPOST";
  const mdDescription = "Mint an AlwaysLiquid post as an NFT";
  const mdUrl = "https://alwaysliquid.com/post/";

  //const provider = waffle.provider;

  beforeEach(async function () {
    [owner, dao, author, user1, user2, dev, referrer] = await ethers.getSigners();

    const MockPunkTld = await ethers.getContractFactory("MockPunkTld");
    mockPunkTldContract = await MockPunkTld.deploy(referrer.address, "referrer");
    await mockPunkTldContract.deployed();

    const PostMetadata = await ethers.getContractFactory("PostMetadata");
    metadataContract = await PostMetadata.deploy(mdName, mdDescription, mdUrl, mockPunkTldContract.address);
    await metadataContract.deployed();

    const PostNft = await ethers.getContractFactory("PostNft");
    postContract = await PostNft.deploy(defaultPrice, metadataContract.address, mdName, symbol);
    await postContract.deployed();

    const PostMinter = await ethers.getContractFactory("PostMinter");
    minterContract = await PostMinter.deploy(dao.address, dev.address, postContract.address, daoFee, devFee, referrerFee);
    await minterContract.deployed();

    await postContract.ownerChangeMinterAddress(minterContract.address);
  });

  // list of tests
  // owner change default price
  it("Owner can change default price", async function () {
    // check price before
    const oldDefaultPrice = await postContract.defaultPrice();
    expect(oldDefaultPrice).to.equal(defaultPrice);

    const newDefaultPrice = ethers.utils.parseEther("2");

    const tx = await postContract.ownerChangeDefaultPrice(newDefaultPrice);
    const receipt = await tx.wait();
    calculateGasCosts("ownerChangeDefaultPrice", receipt);

    // check price after
    const newDefaultPriceAfter = await postContract.defaultPrice();
    expect(newDefaultPriceAfter).to.equal(newDefaultPrice);
  });

  // author set post price
  it("Author can set price for their post", async function () {
    // check price before
    const oldPostPrice = await postContract.getPostPrice(postId, author.address);
    expect(oldPostPrice).to.equal(defaultPrice);

    const newPostPrice = ethers.utils.parseEther("2");

    const tx = await postContract.connect(author).authorSetPostPrice(postId, newPostPrice);
    const receipt = await tx.wait();
    calculateGasCosts("authorSetPostPrice", receipt);

    // check price after
    const newPostPriceAfter = await postContract.getPostPrice(postId, author.address);
    expect(newPostPriceAfter).to.equal(newPostPrice);
  });

  // author set default price
  it("Author can set default price for their posts", async function () {
    // check price before
    const oldDefaultPostPrice = await postContract.getPostPrice("default", author.address);
    expect(oldDefaultPostPrice).to.equal(defaultPrice);

    const newDefaultPostPrice = ethers.utils.parseEther("2");

    const tx = await postContract.connect(author).authorSetDefaultPrice(newDefaultPostPrice);
    const receipt = await tx.wait();
    calculateGasCosts("authorSetDefaultPrice", receipt);

    // check price after
    const newDefaultPostPriceAfter = await postContract.getPostPrice("default", author.address);
    expect(newDefaultPostPriceAfter).to.equal(newDefaultPostPrice);
  });

  // mint 1 nft at default price
  it("can mint 1 nft at default price", async function () {
    const tokenId = 1;

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    //return;

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityOne, // quantity
      { 
        value: defaultPrice 
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintOneNftDefaultPrice", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityOne);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(defaultPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(defaultPrice.mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(defaultPrice.mul(devFee).div(10000)));

    // get NFT metadata
    const nftMetadata = await postContract.uri(tokenId);
    console.log("NFT metadata: ", nftMetadata);

    // fail at fetching uri for non-existent token
    await expect(postContract.uri(23)).to.be.revertedWith("PostNft: Token id does not exist");

    // fetch Post data (token id 1) and assert that text preview in post data is correct
    const postData = await postContract.getPost(tokenId);
    expect(postData.textPreview).to.equal(textPreview);

    // owner changes text preview of post with token id 1
    const newTextPreview = "New text preview";
    await postContract.ownerChangeTextPreview(tokenId, newTextPreview);

    // fetch Post data (token id 1) and assert that text preview in post data is now changed
    const postDataAfter = await postContract.getPost(tokenId);
    expect(postDataAfter.textPreview).to.equal(newTextPreview);

  });

  // user fails to mint through the post contract because only the minter contract can mint
  it("fails to mint through the post contract", async function () {
    const tokenId = 1;

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();
    
    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the post contract
    await expect(
      postContract.connect(user1).mint(
        postId, // post ID
        author.address, // post author
        user1.address, // NFT receiver
        textPreview, // text preview
        "", // image
        quantityOne // quantity
      )
    ).to.be.revertedWith("PostNft: Only minter can mint");

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(0);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore);

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore);

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore);

  });

  // mint multiple nfts at default price
  it("can mint multiple nfts at default price", async function () {
    const tokenId = 1;

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityMultiple, // quantity
      {
        value: defaultPrice.mul(quantityMultiple)
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintMultipleNftsDefaultPrice", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityMultiple);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(defaultPrice.mul(quantityMultiple).mul(10000 - daoFee - devFee - referrerFee).div(10000)));
  
    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(defaultPrice.mul(quantityMultiple).mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(defaultPrice.mul(quantityMultiple).mul(devFee).div(10000)));

  });

  // mint 1 nft with user1 and 1 nft with user2 at default price
  it("can mint 1 nft with user1 and 1 nft with user2 at default price", async function () {
    const tokenId = 1;

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);

    // check user2 balance before
    const user2BalanceBefore = await postContract.balanceOf(user2.address, tokenId);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityOne, // quantity
      {
        value: defaultPrice
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintOneNftDefaultPriceUser1", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityOne);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(defaultPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(defaultPrice.mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(defaultPrice.mul(devFee).div(10000)));

    // mint through the minter contract
    const tx2 = await minterContract.connect(user2).mint(
      postId, // post ID
      author.address, // post author
      user2.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityOne, // quantity
      {
        value: defaultPrice
      }
    );

    const receipt2 = await tx2.wait();
    calculateGasCosts("mintOneNftDefaultPriceUser2", receipt2);

    // check user2 balance after
    const user2BalanceAfter = await postContract.balanceOf(user2.address, tokenId);
    expect(user2BalanceAfter).to.equal(quantityOne);

    // check author ETH balance after
    const authorEthBalanceAfter2 = await author.getBalance();
    expect(authorEthBalanceAfter2).to.equal(authorEthBalanceAfter.add(defaultPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000)));

    // check dao ETH balance after
    const daoEthBalanceAfter2 = await dao.getBalance();
    expect(daoEthBalanceAfter2).to.equal(daoEthBalanceAfter.add(defaultPrice.mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter2 = await dev.getBalance();
    expect(devEthBalanceAfter2).to.equal(devEthBalanceAfter.add(defaultPrice.mul(devFee).div(10000)));

  });

  // mint 1 nft at author default price
  it("can mint 1 nft at author default price", async function () {
    const tokenId = 1;

    // author set default price
    const authorDefaultPrice = ethers.utils.parseEther("0.1");
    await postContract.connect(author).authorSetDefaultPrice(authorDefaultPrice);

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityOne, // quantity
      {
        value: authorDefaultPrice
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintOneNftAuthorDefaultPrice", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityOne);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(authorDefaultPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(authorDefaultPrice.mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(authorDefaultPrice.mul(devFee).div(10000)));

  });

  // mint multiple nfts at author default price
  it("can mint multiple nfts at author default price", async function () {
    const tokenId = 1;

    // author set default price
    const authorDefaultPrice = ethers.utils.parseEther("0.1");
    await postContract.connect(author).authorSetDefaultPrice(authorDefaultPrice);

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityMultiple, // quantity
      {
        value: authorDefaultPrice.mul(quantityMultiple)
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintMultipleNftsAuthorDefaultPrice", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityMultiple);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(authorDefaultPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000).mul(quantityMultiple)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(authorDefaultPrice.mul(daoFee).div(10000).mul(quantityMultiple)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(authorDefaultPrice.mul(devFee).div(10000).mul(quantityMultiple)));

  });

  // mint 1 nft at post price
  it("can mint 1 nft at post price", async function () {
    const tokenId = 1;

    // author set post price
    const postPrice = ethers.utils.parseEther("0.1");
    await postContract.connect(author).authorSetPostPrice(postId, postPrice);

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityOne, // quantity
      {
        value: postPrice
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintOneNftPostPrice", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityOne);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(postPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(postPrice.mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(postPrice.mul(devFee).div(10000)));

  });

  // mint multiple nfts at post price
  it("can mint multiple nfts at post price", async function () {
    const tokenId = 1;

    // author set post price
    const postPrice = ethers.utils.parseEther("0.1");
    await postContract.connect(author).authorSetPostPrice(postId, postPrice);

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityMultiple, // quantity
      {
        value: postPrice.mul(quantityMultiple)
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintMultipleNftsPostPrice", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityMultiple);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(postPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000).mul(quantityMultiple)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(postPrice.mul(daoFee).div(10000).mul(quantityMultiple)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(postPrice.mul(devFee).div(10000).mul(quantityMultiple)));

  });

  // author set mint time to 1 day, user1 mints an NFT within that time at default price
  it("can mint 1 nft at default price within mint time", async function () {
    const tokenId = 1;

    // author set mint time to 1 day
    const mintTime = 86400;
    await postContract.connect(author).authorSetMintTime(postId, mintTime);

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // mint through the minter contract
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityOne, // quantity
      {
        value: defaultPrice
      }
    );

    const receipt = await tx.wait();
    calculateGasCosts("mintOneNftWithinMintTime", receipt);

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityOne);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(defaultPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(defaultPrice.mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(defaultPrice.mul(devFee).div(10000)));

  });

  // author set mint time to 1 day, user1 fails at minting an NFT after that time has passed
  it("cannot mint an nft after mint time has passed", async function () {
    const tokenId = 1;

    // author set mint time to 1 day
    const mintTime = 86400;
    await postContract.connect(author).authorSetMintTime(postId, mintTime);

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // successful mint through the minter contract (important: minting time starts from this moment on)
    const tx = await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreview, // text preview
      "", // image
      quantityOne, // quantity
      {
        value: defaultPrice
      }
    );

    // fast forward time by 1 day
    await network.provider.send("evm_increaseTime", [mintTime+100]);

    // fails to mint after the minting time has passed
    await expect(
      minterContract.connect(user1).mint(
        postId, // post ID
        author.address, // post author
        user1.address, // NFT receiver
        referrer.address, // referrer
        textPreview, // text preview
        "", // image
        quantityOne, // quantity
        {
          value: defaultPrice
        }
      )
    ).to.be.revertedWith("PostNft: Minting deadline has passed");

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(quantityOne);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore.add(defaultPrice.mul(10000 - daoFee - devFee - referrerFee).div(10000)));

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore.add(defaultPrice.mul(daoFee).div(10000)));

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore.add(defaultPrice.mul(devFee).div(10000)));

  });

  // user fails to mint 1 nft at default price because the contract is paused
  it("cannot mint 1 nft at default price because the contract is paused", async function () {
    // owner pause minting in the minter contract
    await minterContract.togglePaused();

    const tokenId = 1;

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // fails to mint because the contract is paused
    await expect(
      minterContract.connect(user1).mint(
        postId, // post ID
        author.address, // post author
        user1.address, // NFT receiver
        referrer.address, // referrer
        textPreview, // text preview
        "", // image
        quantityOne, // quantity
        {
          value: defaultPrice
        }
      )
    ).to.be.revertedWith("Minting paused");

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(0);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore);

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore);

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore);

  });

  // user fails to mint an NFT because the preview text is too long
  it("cannot mint an nft because the preview text is too long", async function () {
    const tokenId = 1;

    const textPreviewLong = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Donec auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet";

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // get author's ETH balance before
    const authorEthBalanceBefore = await author.getBalance();

    // check dao ETH balance before
    const daoEthBalanceBefore = await dao.getBalance();

    // check dev ETH balance before
    const devEthBalanceBefore = await dev.getBalance();

    // fails to mint because the preview text is too long
    await expect(
      minterContract.connect(user1).mint(
        postId, // post ID
        author.address, // post author
        user1.address, // NFT receiver
        referrer.address, // referrer
        textPreviewLong, // text preview
        "", // image
        quantityOne, // quantity
        {
          value: defaultPrice
        }
      )
    ).to.be.revertedWith("PostNft: Text preview is too long");

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(0);

    // check author ETH balance after
    const authorEthBalanceAfter = await author.getBalance();
    expect(authorEthBalanceAfter).to.equal(authorEthBalanceBefore);

    // check dao ETH balance after
    const daoEthBalanceAfter = await dao.getBalance();
    expect(daoEthBalanceAfter).to.equal(daoEthBalanceBefore);

    // check dev ETH balance after
    const devEthBalanceAfter = await dev.getBalance();
    expect(devEthBalanceAfter).to.equal(devEthBalanceBefore);

  });

  it("mints a post NFT with emoji in text", async function () {
    const tokenId = 1;

    const textPreviewEmoji = "Loremicies lacinia. 😅 Nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. 🤣";

    // check user1 balance before
    const user1BalanceBefore = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceBefore).to.equal(0);

    // fails to mint because the preview text is too long
    await minterContract.connect(user1).mint(
      postId, // post ID
      author.address, // post author
      user1.address, // NFT receiver
      referrer.address, // referrer
      textPreviewEmoji, // text preview
      "", // image
      quantityOne, // quantity
      {
        value: defaultPrice
      }
    );

    // check user1 balance after
    const user1BalanceAfter = await postContract.balanceOf(user1.address, tokenId);
    expect(user1BalanceAfter).to.equal(1);

    // get NFT metadata
    const nftMetadata = await postContract.uri(tokenId);
    console.log("NFT metadata: ", nftMetadata);

    // fetch Post data (token id 1) and assert that text preview in post data is correct
    const postData = await postContract.getPost(tokenId);
    expect(postData.textPreview).to.equal(textPreviewEmoji);

  });

});