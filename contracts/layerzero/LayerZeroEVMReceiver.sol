// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for the Kelo Liquidity Pool
interface IKeloLiquidityPool {
    function disburse(address _token, address _merchant, uint256 _amount) external;
}

// Interface for the LayerZero Endpoint
interface ILayerZeroReceiver {
    function lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, uint64 _nonce, bytes calldata _payload) external;
}

contract LayerZeroEVMReceiver is Ownable, ILayerZeroReceiver {
    address public layerZeroEndpoint;
    IKeloLiquidityPool public keloLiquidityPool;

    mapping(uint16 => bytes) public trustedRemotes;

    event MessageReceived(uint16 indexed srcChainId, bytes srcAddress, uint64 nonce, bytes payload);
    event TrustedRemoteSet(uint16 indexed srcChainId, bytes srcAddress);
    event LiquidityPoolSet(address indexed poolAddress);

    constructor(address _layerZeroEndpoint, address _keloLiquidityPool) {
        layerZeroEndpoint = _layerZeroEndpoint;
        keloLiquidityPool = IKeloLiquidityPool(_keloLiquidityPool);
    }

    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external override {
        require(
            keccak256(trustedRemotes[_srcChainId]) == keccak256(_srcAddress),
            "LayerZeroEVMReceiver: Invalid source address"
        );

        // Decode the payload to get disbursement details
        (address token, address merchant, uint256 amount) = abi.decode(
            _payload,
            (address, address, uint256)
        );

        // Call the disburse function on the liquidity pool
        keloLiquidityPool.disburse(token, merchant, amount);

        emit MessageReceived(_srcChainId, _srcAddress, _nonce, _payload);
    }

    function setTrustedRemote(uint16 _srcChainId, bytes calldata _srcAddress) public onlyOwner {
        trustedRemotes[_srcChainId] = _srcAddress;
        emit TrustedRemoteSet(_srcChainId, _srcAddress);
    }

    function setKeloLiquidityPool(address _keloLiquidityPool) public onlyOwner {
        require(_keloLiquidityPool != address(0), "Invalid pool address");
        keloLiquidityPool = IKeloLiquidityPool(_keloLiquidityPool);
        emit LiquidityPoolSet(_keloLiquidityPool);
    }
}
