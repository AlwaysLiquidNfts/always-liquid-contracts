// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";

interface IStats {
  function getWeiSpent(address user_) external view returns (uint256);
}

/** 
@title Collect all wei spending stats from different contracts and return them as one
@author Tempe Techie
*/
contract ActivityPoints is OwnableWithManagers {
  address public postStatsAddress;
  address public nftStatsAddress;
  address public tldStatsAddress;

  constructor(
    address _postStatsAddress,
    address _nftStatsAddress,
    address _tldStatsAddress
  ) {
    postStatsAddress = _postStatsAddress;
    nftStatsAddress = _nftStatsAddress;
    tldStatsAddress = _tldStatsAddress;
  }

  // READ

  function getTotalWeiSpent(address _user) external view returns (uint256) {
    uint256 totalWeiSpent = 0;
    
    if (postStatsAddress != address(0)) {
      totalWeiSpent += IStats(postStatsAddress).getWeiSpent(_user);
    }

    if (nftStatsAddress != address(0)) {
      totalWeiSpent += IStats(nftStatsAddress).getWeiSpent(_user);
    }

    if (tldStatsAddress != address(0)) {
      totalWeiSpent += IStats(tldStatsAddress).getWeiSpent(_user);
    }

    return totalWeiSpent;
  }

  // OWNER

  function setpostStatsAddress(address _postStatsAddress) external onlyManagerOrOwner {
    postStatsAddress = _postStatsAddress;
  }

  function setNftStatsAddress(address _nftStatsAddress) external onlyManagerOrOwner {
    nftStatsAddress = _nftStatsAddress;
  }

  function setTldStatsAddress(address _tldStatsAddress) external onlyManagerOrOwner {
    tldStatsAddress = _tldStatsAddress;
  }
  
}