// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IEcoToken {
    function mint(address to, uint256 amount) external;
}

/// @title EcoLedger — immutable e-waste lifecycle registry for Liberia
/// @dev Uses operator pattern: backend relay calls on behalf of users so users need no gas
contract EcoLedger is Ownable {
    IEcoToken public immutable ecoToken;
    address public operator;

    uint256 public constant CREDITS_REGISTER = 10 * 1e18;
    uint256 public constant CREDITS_TRANSFER  =  5 * 1e18;
    uint256 public constant CREDITS_DISPOSE   = 50 * 1e18;

    enum DeviceStatus { Registered, Transferred, Disposed }

    struct Device {
        bytes32 deviceId;
        address currentOwner;
        DeviceStatus status;
        uint256 registeredAt;
    }

    mapping(bytes32 => Device) public devices;

    event DeviceRegistered(bytes32 indexed deviceId, address indexed owner, uint256 timestamp);
    event DeviceTransferred(bytes32 indexed deviceId, address indexed from, address indexed to, uint256 timestamp);
    event DeviceDisposed(bytes32 indexed deviceId, address indexed owner, uint256 creditsAwarded, uint256 timestamp);

    modifier onlyOperator() {
        require(msg.sender == operator || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _ecoToken) Ownable(msg.sender) {
        ecoToken = IEcoToken(_ecoToken);
        operator = msg.sender;
    }

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
    }

    /// @notice Register a device on behalf of a user. Called by the operator relay.
    function registerDevice(bytes32 deviceId, address user) external onlyOperator {
        require(devices[deviceId].registeredAt == 0, "Already registered");
        devices[deviceId] = Device(deviceId, user, DeviceStatus.Registered, block.timestamp);
        ecoToken.mint(user, CREDITS_REGISTER);
        emit DeviceRegistered(deviceId, user, block.timestamp);
    }

    /// @notice Transfer device ownership on behalf of a user. Called by the operator relay.
    function transferDevice(bytes32 deviceId, address from, address to) external onlyOperator {
        Device storage d = devices[deviceId];
        require(d.status != DeviceStatus.Disposed, "Already disposed");
        d.currentOwner = to;
        d.status = DeviceStatus.Transferred;
        ecoToken.mint(from, CREDITS_TRANSFER);
        emit DeviceTransferred(deviceId, from, to, block.timestamp);
    }

    /// @notice Log disposal and mint variable credits based on material recovery.
    /// @param creditsAmount Credits to mint (in whole units, not wei). 0 = use default 50.
    function disposeDevice(bytes32 deviceId, address user, uint256 creditsAmount) external onlyOperator {
        Device storage d = devices[deviceId];
        require(d.status != DeviceStatus.Disposed, "Already disposed");
        d.status = DeviceStatus.Disposed;
        uint256 amount = creditsAmount > 0 ? creditsAmount * 1e18 : CREDITS_DISPOSE;
        ecoToken.mint(user, amount);
        emit DeviceDisposed(deviceId, user, amount, block.timestamp);
    }

    function getDevice(bytes32 deviceId) external view returns (Device memory) {
        return devices[deviceId];
    }
}
