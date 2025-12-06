// GasGuard Contract ABI
export const GASGUARD_ABI = [
  'function scheduleExecution(tuple(uint256 maxGasPrice, uint256 minAssetPrice, uint256 maxSlippage, uint256 deadline, address target, bytes data, uint256 value, address refundAddress) params) external payable returns (bytes32)',
  'function executeIfSafe(bytes32 executionId) external returns (bool)',
  'function getUserSavings(address user) external view returns (uint256)',
  'function getExecutionStatus(bytes32 executionId) external view returns (bool, uint256, address)',
  'event ExecutionScheduled(bytes32 indexed executionId, address indexed user, uint256 deadline)',
  'event SafeExecutionCompleted(bytes32 indexed executionId, address indexed user, uint256 gasUsed, uint256 flrPrice, uint256 savingsUSD)',
  'event SafetyCheckFailed(bytes32 indexed executionId, string reason, uint256 currentValue, uint256 targetValue)',
  'event RefundIssued(bytes32 indexed executionId, address indexed user, uint256 amount)',
] as const;

// PriceVerifier Contract ABI
export const PRICE_VERIFIER_ABI = [
  'function getCurrentFLRPrice() external view returns (uint256 price, uint8 decimals)',
  'function verifyPriceFloor(uint256 minPrice) external view returns (bool)',
  'function getPrice(bytes32 feedId) external view returns (uint256 price, uint8 decimals)',
] as const;

// SmartAccount Contract ABI
export const SMART_ACCOUNT_ABI = [
  'function batchExecute(tuple(address to, uint256 value, bytes data)[] transactions) external',
  'function execute(address to, uint256 value, bytes data) external',
  'function owner() external view returns (address)',
  'event TransactionExecuted(address indexed to, uint256 value, bytes data, bool success)',
] as const;

// SmartAccountFactory Contract ABI
export const SMART_ACCOUNT_FACTORY_ABI = [
  'function createAccount() external returns (address)',
  'function getAccount(address owner) external view returns (address)',
  'function getAccountCount() external view returns (uint256)',
  'event AccountCreated(address indexed owner, address indexed account)',
] as const;

// FTSOv2 Feed Publisher ABI
export const FTSO_ABI = [
  'function getCurrentPrice(bytes32 feedId) external view returns (int256 value, uint256 timestamp, uint8 decimals)',
  'function getPrice(bytes32 feedId, uint256 epoch) external view returns (int256 value, uint256 timestamp, uint8 decimals)',
] as const;

// Contract Addresses (to be set from environment)
export const CONTRACT_ADDRESSES = {
  GASGUARD: import.meta.env.VITE_GASGUARD_ADDRESS || '0x0000000000000000000000000000000000000000',
  PRICE_VERIFIER: import.meta.env.VITE_PRICE_VERIFIER_ADDRESS || '0x0000000000000000000000000000000000000000',
  SMART_ACCOUNT_FACTORY: import.meta.env.VITE_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
  FTSO: import.meta.env.VITE_FTSO_ADDRESS || '0x0000000000000000000000000000000000000000',
} as const;

