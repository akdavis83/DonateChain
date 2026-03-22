// RSK Testnet Configuration
export const NETWORK_CONFIG = {
  chainId: "0x1f",
  chainIdDecimal: 31,
  chainName: "RSK Testnet",
  rpcUrls: ["https://public-node.testnet.rsk.co"],
  blockExplorerUrls: ["https://explorer.testnet.rootstock.io"],
  nativeCurrency: {
    name: "tRBTC",
    symbol: "tRBTC",
    decimals: 18,
  },
};

// ============================================================
// CONTRACT ADDRESSES — update after deploying to RSK testnet
// ============================================================
export const CONTRACT_ADDRESSES = {
  UserRegistry: "0xb0C881F70d04E5B6b2af2FE8ac7A322053f38662",
  DonationManager: "0x77F9079ba92520353BF7d8d051cafE2362EF82a1",
};

// ============================================================
// ABI: UserRegistry
// ============================================================
export const USER_REGISTRY_ABI = [
  // Events
  "event UsernameRegistered(address indexed user, string username)",
  "event UsernameUpdated(address indexed user, string oldUsername, string newUsername)",
  // Errors
  "error UsernameEmpty()",
  "error UsernameTooLong(uint256 length, uint256 max)",
  "error UsernameAlreadyTaken(string username)",
  "error UserNotRegistered(address user)",
  // Write
  "function register(string calldata username) external",
  "function updateUsername(string calldata newUsername) external",
  // Read
  "function getUsername(address user) external view returns (string memory)",
  "function getAddress(string calldata username) external view returns (address)",
  "function isRegistered(address user) external view returns (bool)",
  "function isUsernameTaken(string calldata username) external view returns (bool)",
];

// ============================================================
// ABI: DonationManager
// ============================================================
export const DONATION_MANAGER_ABI = [
  // Events
  "event DonationMade(uint256 indexed id, address indexed donor, address indexed organization, uint256 amount, bool anonymous, uint256 timestamp)",
  "event Withdrawal(address indexed organization, uint256 amount)",
  // Errors
  "error ZeroAddress()",
  "error ZeroAmount()",
  "error InsufficientBalance(uint256 requested, uint256 available)",
  "error TransferFailed()",
  // Write
  "function donate(address organization, bool anonymous) external payable",
  "function withdraw() external",
  // Read
  "function donations(uint256 id) external view returns (uint256 id_, address donor, address organization, uint256 amount, bool anonymous, uint256 timestamp)",
  "function donationCount() external view returns (uint256)",
  "function getOrgDonationIds(address org) external view returns (uint256[] memory)",
  "function getUserDonationIds(address user) external view returns (uint256[] memory)",
  "function getOrgStats(address org) external view returns (uint256 totalReceived, uint256 donationCount, uint256 lastDonationTime)",
  "function orgBalances(address org) external view returns (uint256)",
  "function registry() external view returns (address)",
];

// ============================================================
// Solidity Source: UserRegistry.sol
// ============================================================
export const USER_REGISTRY_SOL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRegistry {
    uint256 public constant MAX_USERNAME_LENGTH = 32;

    mapping(address => string) private _usernames;
    mapping(string => address) private _addresses;

    event UsernameRegistered(address indexed user, string username);
    event UsernameUpdated(address indexed user, string oldUsername, string newUsername);

    error UsernameEmpty();
    error UsernameTooLong(uint256 length, uint256 max);
    error UsernameAlreadyTaken(string username);
    error UserNotRegistered(address user);

    function register(string calldata username) external {
        if (bytes(username).length == 0) revert UsernameEmpty();
        if (bytes(username).length > MAX_USERNAME_LENGTH) revert UsernameTooLong(bytes(username).length, MAX_USERNAME_LENGTH);
        if (_addresses[username] != address(0)) revert UsernameAlreadyTaken(username);
        require(bytes(_usernames[msg.sender]).length == 0, "Already registered");

        _usernames[msg.sender] = username;
        _addresses[username] = msg.sender;
        emit UsernameRegistered(msg.sender, username);
    }

    function updateUsername(string calldata newUsername) external {
        if (bytes(_usernames[msg.sender]).length == 0) revert UserNotRegistered(msg.sender);
        if (bytes(newUsername).length == 0) revert UsernameEmpty();
        if (bytes(newUsername).length > MAX_USERNAME_LENGTH) revert UsernameTooLong(bytes(newUsername).length, MAX_USERNAME_LENGTH);
        if (_addresses[newUsername] != address(0)) revert UsernameAlreadyTaken(newUsername);

        string memory oldUsername = _usernames[msg.sender];
        delete _addresses[oldUsername];
        _usernames[msg.sender] = newUsername;
        _addresses[newUsername] = msg.sender;
        emit UsernameUpdated(msg.sender, oldUsername, newUsername);
    }

    function getUsername(address user) external view returns (string memory) {
        return _usernames[user];
    }

    function getAddress(string calldata username) external view returns (address) {
        return _addresses[username];
    }

    function isRegistered(address user) external view returns (bool) {
        return bytes(_usernames[user]).length > 0;
    }

    function isUsernameTaken(string calldata username) external view returns (bool) {
        return _addresses[username] != address(0);
    }
}`;

// ============================================================
// Solidity Source: DonationManager.sol
// ============================================================
export const DONATION_MANAGER_SOL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUserRegistry {
    function getUsername(address user) external view returns (string memory);
    function isRegistered(address user) external view returns (bool);
}

contract DonationManager {
    struct Donation {
        uint256 id;
        address donor;
        address organization;
        uint256 amount;
        bool anonymous;
        uint256 timestamp;
    }

    struct OrgStats {
        uint256 totalReceived;
        uint256 donationCount;
        uint256 lastDonationTime;
    }

    IUserRegistry public immutable registry;
    uint256 public donationCount;

    mapping(uint256 => Donation) public donations;
    mapping(address => uint256[]) private _orgDonationIds;
    mapping(address => uint256[]) private _userDonationIds;
    mapping(address => OrgStats) public orgStats;
    mapping(address => uint256) public orgBalances;

    event DonationMade(uint256 indexed id, address indexed donor, address indexed organization, uint256 amount, bool anonymous, uint256 timestamp);
    event Withdrawal(address indexed organization, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance(uint256 requested, uint256 available);
    error TransferFailed();

    constructor(address _registry) {
        if (_registry == address(0)) revert ZeroAddress();
        registry = IUserRegistry(_registry);
    }

    function donate(address organization, bool anonymous) external payable {
        if (organization == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroAmount();

        uint256 id = donationCount++;
        uint256 ts = block.timestamp;

        donations[id] = Donation(id, msg.sender, organization, msg.value, anonymous, ts);
        _orgDonationIds[organization].push(id);
        _userDonationIds[msg.sender].push(id);

        OrgStats storage stats = orgStats[organization];
        stats.totalReceived += msg.value;
        stats.donationCount += 1;
        stats.lastDonationTime = ts;

        orgBalances[organization] += msg.value;

        emit DonationMade(id, msg.sender, organization, msg.value, anonymous, ts);
    }

    function withdraw() external {
        uint256 balance = orgBalances[msg.sender];
        if (balance == 0) revert InsufficientBalance(balance, 0);

        orgBalances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        if (!success) revert TransferFailed();

        emit Withdrawal(msg.sender, balance);
    }

    function getOrgDonationIds(address org) external view returns (uint256[] memory) {
        return _orgDonationIds[org];
    }

    function getUserDonationIds(address user) external view returns (uint256[] memory) {
        return _userDonationIds[user];
    }

    function getOrgStats(address org) external view returns (uint256 totalReceived, uint256 count, uint256 lastDonationTime) {
        OrgStats memory s = orgStats[org];
        return (s.totalReceived, s.donationCount, s.lastDonationTime);
    }
}`;