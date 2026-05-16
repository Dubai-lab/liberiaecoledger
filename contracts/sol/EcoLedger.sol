// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IEcoToken {
    function mint(address to, uint256 amount) external;
}

/// @title EcoLedger — immutable e-waste lifecycle registry for Liberia
contract EcoLedger is Ownable {
    IEcoToken public immutable ecoToken;

    // Credits awarded per lifecycle event
    uint256 public constant CREDITS_REGISTER  = 10  * 1e18;
    uint256 public constant CREDITS_TRANSFER   = 5   * 1e18;
    uint256 public constant CREDITS_DISPOSE    = 50  * 1e18;

    enum DeviceStatus { Registered, Transferred, Disposed }

    struct Device {
        bytes32 deviceId;       // Supabase UUID hashed
        address currentOwner;
        DeviceStatus status;
        uint256 registeredAt;
    }

    mapping(bytes32 => Device) public devices;

    event DeviceRegistered(bytes32 indexed deviceId, address indexed owner, uint256 timestamp);
    event DeviceTransferred(bytes32 indexed deviceId, address indexed from, address indexed to, uint256 timestamp);
    event DeviceDisposed(bytes32 indexed deviceId, address indexed owner, uint256 timestamp);

    constructor(address _ecoToken) Ownable(msg.sender) {
        ecoToken = IEcoToken(_ecoToken);
    }

    function registerDevice(bytes32 deviceId) external {
        require(devices[deviceId].registeredAt == 0, "Already registered");
        devices[deviceId] = Device(deviceId, msg.sender, DeviceStatus.Registered, block.timestamp);
        ecoToken.mint(msg.sender, CREDITS_REGISTER);
        emit DeviceRegistered(deviceId, msg.sender, block.timestamp);
    }

    function transferDevice(bytes32 deviceId, address newOwner) external {
        Device storage d = devices[deviceId];
        require(d.currentOwner == msg.sender, "Not owner");
        require(d.status != DeviceStatus.Disposed, "Already disposed");
        d.currentOwner = newOwner;
        d.status = DeviceStatus.Transferred;
        ecoToken.mint(msg.sender, CREDITS_TRANSFER);
        emit DeviceTransferred(deviceId, msg.sender, newOwner, block.timestamp);
    }

    function disposeDevice(bytes32 deviceId) external {
        Device storage d = devices[deviceId];
        require(d.currentOwner == msg.sender, "Not owner");
        require(d.status != DeviceStatus.Disposed, "Already disposed");
        d.status = DeviceStatus.Disposed;
        ecoToken.mint(msg.sender, CREDITS_DISPOSE);
        emit DeviceDisposed(deviceId, msg.sender, block.timestamp);
    }

    function getDevice(bytes32 deviceId) external view returns (Device memory) {
        return devices[deviceId];
    }
}
