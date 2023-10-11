# AlwaysLiquid | Social NFT Marketplace where NFTs are always liquid

This repository holds smart contracts for the AlwaysLiquid protocol.

Each AlwaysLiquid NFT collection has an integrated ETH pool that allows any NFT holder to always sell (and burn) their NFT and get back a certain amount of ETH (except the holder of the last remaining NFT in a collection).

When user buys/mints an NFT, the payment (minus fees) goes into the pool. Pricing is set based on a bonding curve. When user sells/burns their NFT, they get back an ETH amount that may be higher or lower for what they paid for (based on the current price on the bonding curve).

The buy/sell mechanics does not interfere with other standard NFT functions, such as transferring an NFT. An NFT can also be freely traded on NFT marketplaces. The integrated pool does give NFTs an intrinsic value, though.