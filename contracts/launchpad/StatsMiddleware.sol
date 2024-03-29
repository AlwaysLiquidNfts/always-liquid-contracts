// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";

interface IStats {
  function addWeiSpent(address user_, uint256 weiSpent_) external;
}

/** 
@title Launchpad Stats Middleware
@author Tempe Techie
*/
contract StatsMiddleware is OwnableWithManagers {
  address public statsAddress;
  mapping (address => bool) public writers; // writer contracts that can send stats to this contract

  // WRITER

  function addWeiSpent(address user_, uint256 weiSpent_) external {
    require(writers[msg.sender], "Not a writer contract");
    
    IStats(statsAddress).addWeiSpent(user_, weiSpent_);
  }

  function addWriterByWriter(address writer_) external {
    require(writers[msg.sender], "Not a writer contract");
    writers[writer_] = true;
  }
  
  // OWNER
  function addWriter(address writer_) external onlyManagerOrOwner {
    writers[writer_] = true;
  }

  function removeWriter(address writer_) external onlyManagerOrOwner {
    writers[writer_] = false;
  }

  function setStatsAddress(address statsAddress_) external onlyManagerOrOwner {
    statsAddress = statsAddress_;
  }

}
