// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PulseNebulaHub
 * @notice Fully homomorphic encrypted pulse repository for PulseNebula members.
 *         Encrypted averages are stored on-chain while IPFS CIDs keep encrypted raw telemetry.
 *         The contract exposes helper methods to let users authorize fine-grained decryption.
 */
contract PulseNebulaHub is ZamaEthereumConfig {
    struct PulseSample {
        uint256 id;
        address user;
        string dataCID;
        euint32 encryptedAvgRate;
        uint32 publicAvgRate;
        uint32 measurementCount;
        uint32 minBpm;
        uint32 maxBpm;
        uint256 timestamp;
        bool isPublic;
    }

    event SampleLogged(
        uint256 indexed id,
        address indexed user,
        uint32 publicAvgRate,
        uint32 measurementCount,
        bool isPublic
    );

    mapping(uint256 => PulseSample) private _samples;
    mapping(address => uint256[]) private _userSamples;
    uint256 private _sampleCount;

    // Aggregated encrypted analytics for public entries
    euint32 private _collectiveAvgSum;
    euint32 private _collectiveCount;

    modifier onlySampleOwner(uint256 sampleId) {
        require(_samples[sampleId].user == msg.sender, "PulseNebulaHub: not sample owner");
        _;
    }

    /**
     * @notice Store a new encrypted pulse sample.
     * @param dataCID IPFS CID pointing to encrypted pulse telemetry payload.
     * @param avgRateExt Encrypted average pulse handle provided by the client.
     * @param inputProof zk proof produced by the FHE SDK for this encrypted input.
     * @param publicAvgRate Optional clear-text average to show publicly (ignored when isPublic = false).
     * @param isPublic Flag indicating if the aggregated stat may be surfaced publicly.
     */
    function logPulseSample(
        string calldata dataCID,
        externalEuint32 avgRateExt,
        bytes calldata inputProof,
        uint32 publicAvgRate,
        uint32 measurementCount,
        uint32 minBpm,
        uint32 maxBpm,
        bool isPublic
    ) external returns (uint256 sampleId) {
        euint32 encryptedAvgRate = FHE.fromExternal(avgRateExt, inputProof);

        require(measurementCount > 0, "PulseNebulaHub: invalid measurement count");
        require(minBpm <= maxBpm, "PulseNebulaHub: invalid bpm range");

        sampleId = ++_sampleCount;

        _samples[sampleId] = PulseSample({
            id: sampleId,
            user: msg.sender,
            dataCID: dataCID,
            encryptedAvgRate: encryptedAvgRate,
            publicAvgRate: isPublic ? publicAvgRate : 0,
            measurementCount: measurementCount,
            minBpm: minBpm,
            maxBpm: maxBpm,
            timestamp: block.timestamp,
            isPublic: isPublic
        });

        _userSamples[msg.sender].push(sampleId);

        // Grant decryption rights to the contract and to the uploader
        FHE.allowThis(encryptedAvgRate);
        FHE.allow(encryptedAvgRate, msg.sender);

        if (isPublic) {
            // Update encrypted aggregations for DAO analytics
            _collectiveAvgSum = FHE.add(_collectiveAvgSum, encryptedAvgRate);
            _collectiveCount = FHE.add(_collectiveCount, FHE.asEuint32(1));

            FHE.allowThis(_collectiveAvgSum);
            FHE.allowThis(_collectiveCount);
        }

        emit SampleLogged(
            sampleId,
            msg.sender,
            isPublic ? publicAvgRate : 0,
            measurementCount,
            isPublic
        );
    }

    /**
     * @notice Allow a viewer to decrypt a specific pulse sample.
     * @dev Only the owner can grant access.
     */
    function grantSampleAccess(uint256 sampleId, address viewer) external onlySampleOwner(sampleId) {
        require(viewer != address(0), "PulseNebulaHub: invalid viewer");
        FHE.allow(_samples[sampleId].encryptedAvgRate, viewer);
    }

    /**
     * @notice Allow the caller to decrypt global DAO statistics (public submissions only).
     */
    function authorizeCollectivePulse() external {
        FHE.allow(_collectiveAvgSum, msg.sender);
        FHE.allow(_collectiveCount, msg.sender);
    }

    /**
     * @return sample PulseSample struct including encrypted average handle.
     */
    function retrieveSample(uint256 sampleId) external view returns (PulseSample memory sample) {
        sample = _samples[sampleId];
        require(sample.user != address(0), "PulseNebulaHub: sample not found");
    }

    /**
     * @return sampleIds Array of sample ids uploaded by the user.
     */
    function listSamplesForUser(address user) external view returns (uint256[] memory sampleIds) {
        sampleIds = _userSamples[user];
    }

    /**
     * @return encryptedSum Encrypted sum of all public average pulse values.
     * @return encryptedCount Encrypted number of public submissions.
     *         Clients can decrypt both values to compute average off-chain.
     */
    function collectivePulseHandles() external view returns (euint32 encryptedSum, euint32 encryptedCount) {
        encryptedSum = _collectiveAvgSum;
        encryptedCount = _collectiveCount;
    }

    /**
     * @notice Convenience getter for non-sensitive metadata (stored in clear).
     */
    function getSampleSynopsis(uint256 sampleId)
        external
        view
        returns (
            address user,
            string memory dataCID,
            uint32 publicAvgRate,
            uint32 measurementCount,
            uint32 minBpm,
            uint32 maxBpm,
            uint256 timestamp,
            bool isPublic
        )
    {
        PulseSample storage sample = _samples[sampleId];
        require(sample.user != address(0), "PulseNebulaHub: sample not found");

        return (
            sample.user,
            sample.dataCID,
            sample.publicAvgRate,
            sample.measurementCount,
            sample.minBpm,
            sample.maxBpm,
            sample.timestamp,
            sample.isPublic
        );
    }

    function totalSamples() external view returns (uint256) {
        return _sampleCount;
    }
}

