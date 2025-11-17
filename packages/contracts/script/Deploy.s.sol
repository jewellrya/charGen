// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Nral721} from "../contracts/Nral721.sol";

contract DeployNral is Script {
    function run() external {
        vm.startBroadcast();
        Nral721 c = new Nral721();
        vm.stopBroadcast();
        console2.log("Nral721 deployed to:", address(c));
    }
}
