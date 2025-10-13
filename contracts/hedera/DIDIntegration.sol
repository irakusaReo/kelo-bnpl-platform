// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IDIDRegistry {
    function registerDID(address owner, string calldata didDocument) external;
    function resolveDID(address owner) external view returns (string memory);
    function updateDID(address owner, string calldata newDidDocument) external;
}

contract DIDIntegration is Ownable {
    address public didRegistryAddress;

    constructor(address _registryAddress) {
        didRegistryAddress = _registryAddress;
    }

    function setDIDRegistryAddress(address _newAddress) public onlyOwner {
        didRegistryAddress = _newAddress;
    }

    function createDID(string calldata didDocument) public {
        IDIDRegistry(didRegistryAddress).registerDID(msg.sender, didDocument);
    }

    function getDID(address owner) public view returns (string memory) {
        return IDIDRegistry(didRegistryAddress).resolveDID(owner);
    }

    function updateDID(string calldata newDidDocument) public {
        IDIDRegistry(didRegistryAddress).updateDID(msg.sender, newDidDocument);
    }
}
