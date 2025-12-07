import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

interface PythonMonitorData {
  timestamp: string;
  timestamp_ms: number;
  gasPrice: {
    gwei: number;
    wei: string;
  };
  baseFee?: number;
  priorityFee?: number;
  suggestedMaxFeePerGas: number;
  suggestedMaxPriorityFeePerGas?: number;
  source: string;
}

export class PythonGasMonitorService {
  private jsonFilePath: string;
  private maxAgeMs = 60000; // 60 seconds - consider data stale after this

  constructor() {
    // Path to the JSON file created by Python monitor
    // Python script writes to project root (gas-guardian-ai-main/)
    // Try multiple path resolution strategies for reliability
    
    // Get __dirname equivalent for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Strategy 1: From backend/src/services/ go up to project root
    const fromServiceDir = path.resolve(__dirname, '../../..');
    
    // Strategy 2: From current working directory (where node process runs)
    const fromCwd = process.cwd();
    
    // Strategy 3: If running from backend/, go up one level
    const fromBackend = path.resolve(process.cwd(), '..');
    
    // Try each path and use the first one that makes sense
    // Check if we're in backend/ directory structure
    let projectRoot = fromCwd;
    if (fromCwd.endsWith('backend')) {
      projectRoot = fromBackend;
    } else if (fs.existsSync(path.join(fromServiceDir, 'gas_fee_monitor.py'))) {
      projectRoot = fromServiceDir;
    } else if (fs.existsSync(path.join(fromCwd, 'gas_fee_monitor.py'))) {
      projectRoot = fromCwd;
    }
    
    this.jsonFilePath = path.join(projectRoot, 'gas_monitor_data.json');
    
    console.log(`Python monitor JSON path: ${this.jsonFilePath}`);
  }

  /**
   * Check if Python monitor data is available and fresh
   */
  isAvailable(): boolean {
    try {
      if (!fs.existsSync(this.jsonFilePath)) {
        return false;
      }

      const stats = fs.statSync(this.jsonFilePath);
      const ageMs = Date.now() - stats.mtimeMs;

      // Data is considered available if file exists and is less than maxAge old
      return ageMs < this.maxAgeMs;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current gas price from Python monitor
   */
  getCurrentGas(): { gwei: number; wei: string; timestamp: number } | null {
    try {
      if (!this.isAvailable()) {
        return null;
      }

      const fileContent = fs.readFileSync(this.jsonFilePath, 'utf-8');
      const data: PythonMonitorData = JSON.parse(fileContent);

      return {
        gwei: data.gasPrice.gwei,
        wei: data.gasPrice.wei,
        timestamp: data.timestamp_ms,
      };
    } catch (error) {
      console.error('Error reading Python monitor data:', error);
      return null;
    }
  }

  /**
   * Get full monitor data
   */
  getFullData(): PythonMonitorData | null {
    try {
      if (!this.isAvailable()) {
        return null;
      }

      const fileContent = fs.readFileSync(this.jsonFilePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading Python monitor data:', error);
      return null;
    }
  }
}

export default new PythonGasMonitorService();

