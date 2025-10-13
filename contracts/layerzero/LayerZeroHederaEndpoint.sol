// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;
}

contract LayerZeroHederaEndpoint is Ownable {
    address public layerZeroEndpointAddress;

    constructor(address _layerZeroEndpoint) {
        layerZeroEndpointAddress = _layerZeroEndpoint;
    }

    function setLayerZeroEndpoint(address _newEndpoint) public onlyOwner {
        layerZeroEndpointAddress = _newEndpoint;
    }

    function sendMessage(
        uint16 _dstChainId,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) public payable {
        ILayerZeroEndpoint(layerZeroEndpointAddress).send(
            _dstChainId,
            _payload,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
    }
}
