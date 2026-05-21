APPENDIX A: ECOLEDGER SMART CONTRACT SOURCE CODE

The following is the Solidity smart contract deployed on the Ethereum Sepolia testnet.
It serves as the immutable audit ledger for device lifecycle events in the EcoLedger platform.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EcoLedger {

    struct DeviceEvent {
        string  eventType;
        bytes32 dataHash;
        uint256 timestamp;
        address actor;
    }

    mapping(string => DeviceEvent[]) private deviceEvents;

    event EventLogged(
        string  indexed deviceId,
        string          eventType,
        bytes32         dataHash,
        uint256         timestamp
    );

    function logEvent(
        string  calldata deviceId,
        string  calldata eventType,
        bytes32          dataHash
    ) external {
        deviceEvents[deviceId].push(DeviceEvent({
            eventType : eventType,
            dataHash  : dataHash,
            timestamp : block.timestamp,
            actor     : msg.sender
        }));

        emit EventLogged(deviceId, eventType, dataHash, block.timestamp);
    }

    function getEvents(string calldata deviceId)
        external
        view
        returns (DeviceEvent[] memory)
    {
        return deviceEvents[deviceId];
    }
}
