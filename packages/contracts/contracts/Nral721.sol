// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ✅ named imports
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Nral721 is ERC721URIStorage, Ownable {
    uint256 public nextId;

    // ✅ now ERC721 is in scope
    constructor() ERC721("Nral Test", "NRAL") Ownable(msg.sender) {
        nextId = 1;
    }

    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 id = nextId++;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        return id;
    }
}
