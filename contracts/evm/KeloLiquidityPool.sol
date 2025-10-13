// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract KeloLiquidityPool is Ownable, ReentrancyGuard {
    address public usdcToken;
    address public usdtToken;
    address public relayer;

    mapping(address => mapping(address => uint256)) public deposits;

    event Deposit(address indexed token, address indexed user, uint256 amount);
    event Withdrawal(address indexed token, address indexed user, uint256 amount);
    event Disbursement(address indexed token, address indexed merchant, uint256 amount);
    event RelayerUpdated(address indexed newRelayer);

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Caller is not the relayer");
        _;
    }

    modifier isSupportedToken(address token) {
        require(token == usdcToken || token == usdtToken, "Token not supported");
        _;
    }

    constructor(address _usdcToken, address _usdtToken, address _relayer) {
        usdcToken = _usdcToken;
        usdtToken = _usdtToken;
        relayer = _relayer;
    }

    function setRelayer(address _newRelayer) public onlyOwner {
        require(_newRelayer != address(0), "Invalid relayer address");
        relayer = _newRelayer;
        emit RelayerUpdated(_newRelayer);
    }

    function deposit(address _token, uint256 _amount) public nonReentrant isSupportedToken(_token) {
        require(_amount > 0, "Amount must be greater than zero");
        uint256 allowance = IERC20(_token).allowance(msg.sender, address(this));
        require(allowance >= _amount, "Check token allowance");

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        deposits[_token][msg.sender] += _amount;

        emit Deposit(_token, msg.sender, _amount);
    }

    function withdraw(address _token, uint256 _amount) public nonReentrant isSupportedToken(_token) {
        require(_amount > 0, "Amount must be greater than zero");
        require(deposits[_token][msg.sender] >= _amount, "Insufficient balance");

        deposits[_token][msg.sender] -= _amount;
        IERC20(_token).transfer(msg.sender, _amount);

        emit Withdrawal(_token, msg.sender, _amount);
    }

    function disburse(address _token, address _merchant, uint256 _amount) public nonReentrant onlyRelayer isSupportedToken(_token) {
        require(_amount > 0, "Amount must be greater than zero");
        require(IERC20(_token).balanceOf(address(this)) >= _amount, "Insufficient pool balance");

        IERC20(_token).transfer(_merchant, _amount);

        emit Disbursement(_token, _merchant, _amount);
    }

    function getDeposit(address _token, address _user) public view isSupportedToken(_token) returns (uint256) {
        return deposits[_token][_user];
    }

    function getSupportedTokens() public view returns (address, address) {
        return (usdcToken, usdtToken);
    }
}
