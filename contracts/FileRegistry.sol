// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title FileRegistry
/// @notice Store IPFS CIDs on-chain with a tiny metadata record and event
/// @dev Designed to be simple and frontend-friendly (store CID off-chain via IPFS, then call storeFile)
contract FileRegistry {
    struct File {
        string cid;        // IPFS CID (e.g. "bafy...")
        string name;       // optional filename or description
        address uploader;  // who recorded it
        uint256 timestamp; // block timestamp when recorded
    }

    // Mapping of uploader => array of files they've registered
    mapping(address => File[]) private filesByUser;

    // Global list of files (optional)
    File[] private allFiles;

    // Events
    event FileStored(address indexed uploader, string cid, string name, uint256 timestamp, uint256 globalIndex, uint256 userIndex);

    /// @notice Store a file's IPFS CID on-chain
    /// @param cid The IPFS CID (string)
    /// @param name Optional name or description
    function storeFile(string calldata cid, string calldata name) external {
        require(bytes(cid).length > 0, "CID required");

        File memory f = File({
            cid: cid,
            name: name,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        // push to user's array
        filesByUser[msg.sender].push(f);

        // push to global array and capture indexes for event
        uint256 globalIndex = allFiles.length;
        allFiles.push(f);
        uint256 userIndex = filesByUser[msg.sender].length - 1;

        emit FileStored(msg.sender, cid, name, block.timestamp, globalIndex, userIndex);
    }

    /// @notice Get number of files uploaded by a user
    /// @param user address to query
    function getUserFileCount(address user) external view returns (uint256) {
        return filesByUser[user].length;
    }

    /// @notice Get a single file record for a particular user by index
    /// @param user address to query
    /// @param index index in that user's list (0-based)
    function getUserFile(address user, uint256 index) external view returns (string memory cid, string memory name, address uploader, uint256 timestamp) {
        require(index < filesByUser[user].length, "index out of bounds");
        File storage f = filesByUser[user][index];
        return (f.cid, f.name, f.uploader, f.timestamp);
    }

    /// @notice Get global file count
    function getGlobalFileCount() external view returns (uint256) {
        return allFiles.length;
    }

    /// @notice Get a global file record by index
    function getGlobalFile(uint256 index) external view returns (string memory cid, string memory name, address uploader, uint256 timestamp) {
        require(index < allFiles.length, "index out of bounds");
        File storage f = allFiles[index];
        return (f.cid, f.name, f.uploader, f.timestamp);
    }
}
