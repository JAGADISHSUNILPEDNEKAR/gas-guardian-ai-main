#!/usr/bin/env python3

"""

Gas Fee Monitor & Smart Transaction Trigger

Production-grade Ethereum gas fee automation system

"""

import requests

import time

import statistics

import logging

import csv

from datetime import datetime

from typing import List, Optional

from dataclasses import dataclass

import json

# ============================

# CONFIGURATION

# ============================

CONFIG = {

    "gas_api_url": "https://gas.api.cx.metamask.io/networks/1/suggestedGasFees",

    "fetch_interval": 1,  # seconds between fetches

    "collection_window": 1800,  # 30 minutes in seconds

    "retry_wait": 60,  # seconds to wait before retrying transaction

    "max_retries": 3,  # max API call retries

    "backoff_factor": 2,  # exponential backoff multiplier

    "csv_export": True,  # export data to CSV

    "csv_filename": "gas_fees_data.csv",

    "json_output": True,  # export real-time data to JSON

    "json_filename": "gas_monitor_data.json"  # file for backend to read

}

# ============================

# LOGGING SETUP

# ============================

logging.basicConfig(

    level=logging.INFO,

    format='%(asctime)s - %(levelname)s - %(message)s',

    handlers=[

        logging.FileHandler('gas_monitor.log'),

        logging.StreamHandler()

    ]

)

logger = logging.getLogger(__name__)

# ============================

# DATA STRUCTURES

# ============================

@dataclass

class GasFeeRecord:

    """Record of a single gas fee measurement"""

    timestamp: datetime

    suggested_max_fee: float

    base_fee: Optional[float] = None

    priority_fee: Optional[float] = None

# ============================

# GAS FEE FETCHER

# ============================

class GasFeeMonitor:

    """Monitors Ethereum gas fees and triggers transactions based on threshold"""

    

    def __init__(self, config: dict):

        self.config = config

        self.fee_records: List[GasFeeRecord] = []

        self.threshold_mean: Optional[float] = None

        

    def fetch_gas_fee(self) -> Optional[GasFeeRecord]:

        """Fetch current gas fee from MetaMask API with retry logic"""

        for attempt in range(self.config["max_retries"]):

            try:

                response = requests.get(

                    self.config["gas_api_url"],

                    timeout=10

                )

                response.raise_for_status()

                data = response.json()

                

                # Parse the suggested max fee (in Gwei)

                suggested_max_fee = float(data.get("suggestedMaxFeePerGas", 0))

                base_fee = float(data.get("estimatedBaseFee", 0))

                priority_fee = float(data.get("suggestedMaxPriorityFeePerGas", 0))

                

                record = GasFeeRecord(

                    timestamp=datetime.now(),

                    suggested_max_fee=suggested_max_fee,

                    base_fee=base_fee,

                    priority_fee=priority_fee

                )

                

                logger.info(f"Fetched gas fee: {suggested_max_fee:.2f} Gwei")

                
                # Write to JSON file for backend consumption
                if self.config.get("json_output", False):
                    self.write_to_json(record)

                
                return record

                

            except requests.exceptions.RequestException as e:

                wait_time = self.config["backoff_factor"] ** attempt

                logger.warning(f"Fetch attempt {attempt + 1} failed: {e}")

                

                if attempt < self.config["max_retries"] - 1:

                    logger.info(f"Retrying in {wait_time}s...")

                    time.sleep(wait_time)

                else:

                    logger.error("Max retries reached. Skipping this fetch.")

                    

            except (KeyError, ValueError, json.JSONDecodeError) as e:

                logger.error(f"Data parsing error: {e}")

                break

                

        return None

    

    def collect_baseline_data(self):

        """Collect gas fee data for 30 minutes to establish baseline"""

        logger.info("=" * 60)

        logger.info("STARTING BASELINE DATA COLLECTION (30 minutes)")

        logger.info("=" * 60)

        

        total_samples = self.config["collection_window"] // self.config["fetch_interval"]

        logger.info(f"Target samples: {total_samples}")

        

        start_time = time.time()

        

        for i in range(total_samples):

            record = self.fetch_gas_fee()

            

            if record:

                self.fee_records.append(record)

                

                # Progress update every 60 seconds

                if (i + 1) % 60 == 0:

                    elapsed = time.time() - start_time

                    progress = (i + 1) / total_samples * 100

                    logger.info(f"Progress: {progress:.1f}% ({i + 1}/{total_samples} samples) - "

                              f"Elapsed: {elapsed / 60:.1f} min")

            

            # Sleep until next fetch

            time.sleep(self.config["fetch_interval"])

        

        logger.info("=" * 60)

        logger.info("BASELINE COLLECTION COMPLETE")

        logger.info("=" * 60)

        

    def calculate_threshold(self) -> float:

        """Calculate mean gas fee from collected data"""

        if not self.fee_records:

            raise ValueError("No fee records available for threshold calculation")

        

        fees = [record.suggested_max_fee for record in self.fee_records]

        

        mean_fee = statistics.mean(fees)

        median_fee = statistics.median(fees)

        stdev_fee = statistics.stdev(fees) if len(fees) > 1 else 0

        

        self.threshold_mean = mean_fee

        

        logger.info(f"Threshold Statistics:")

        logger.info(f"  Mean:   {mean_fee:.4f} Gwei")

        logger.info(f"  Median: {median_fee:.4f} Gwei")

        logger.info(f"  StdDev: {stdev_fee:.4f} Gwei")

        logger.info(f"  Min:    {min(fees):.4f} Gwei")

        logger.info(f"  Max:    {max(fees):.4f} Gwei")

        

        return mean_fee

    

    def should_send_transaction(self, current_fee: float) -> bool:

        """Determine if current fee is below threshold"""

        if self.threshold_mean is None:

            raise ValueError("Threshold not calculated yet")

        

        return current_fee < self.threshold_mean

    

    def write_to_json(self, record: GasFeeRecord):

        """Write current gas data to JSON file for backend consumption"""

        try:

            json_data = {

                "timestamp": record.timestamp.isoformat(),

                "timestamp_ms": int(record.timestamp.timestamp() * 1000),

                "gasPrice": {

                    "gwei": round(record.suggested_max_fee, 2),

                    "wei": str(int(record.suggested_max_fee * 1e9))

                },

                "baseFee": round(record.base_fee, 2) if record.base_fee else None,

                "priorityFee": round(record.priority_fee, 2) if record.priority_fee else None,

                "suggestedMaxFeePerGas": round(record.suggested_max_fee, 2),

                "suggestedMaxPriorityFeePerGas": round(record.priority_fee, 2) if record.priority_fee else None,

                "source": "metamask_api"

            }

            

            with open(self.config["json_filename"], 'w') as f:

                json.dump(json_data, f, indent=2)

                

        except Exception as e:

            logger.error(f"JSON export failed: {e}")

    

    def export_to_csv(self):

        """Export collected data to CSV file"""

        if not self.config["csv_export"] or not self.fee_records:

            return

        

        try:

            with open(self.config["csv_filename"], 'w', newline='') as f:

                writer = csv.writer(f)

                writer.writerow(['Timestamp', 'Suggested_Max_Fee_Gwei', 'Base_Fee_Gwei', 'Priority_Fee_Gwei'])

                

                for record in self.fee_records:

                    writer.writerow([

                        record.timestamp.isoformat(),

                        record.suggested_max_fee,

                        record.base_fee,

                        record.priority_fee

                    ])

            

            logger.info(f"Data exported to {self.config['csv_filename']}")

        except Exception as e:

            logger.error(f"CSV export failed: {e}")

# ============================

# TRANSACTION LOGIC

# ============================

def send_transaction():

    """

    Placeholder for Web3 transaction logic

    

    To implement actual transaction:

    1. Install: pip install web3

    2. Import: from web3 import Web3

    3. Setup: w3 = Web3(Web3.HTTPProvider('YOUR_RPC_URL'))

    4. Configure wallet and transaction parameters

    

    Example:

        w3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR_KEY'))

        account = w3.eth.account.from_key('YOUR_PRIVATE_KEY')

        

        tx = {

            'nonce': w3.eth.get_transaction_count(account.address),

            'to': 'RECIPIENT_ADDRESS',

            'value': w3.to_wei(0.01, 'ether'),

            'gas': 21000,

            'maxFeePerGas': w3.to_wei(current_fee, 'gwei'),

            'maxPriorityFeePerGas': w3.to_wei(2, 'gwei'),

            'chainId': 1

        }

        

        signed_tx = w3.eth.account.sign_transaction(tx, account.key)

        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        logger.info(f"Transaction sent: {tx_hash.hex()}")

    """

    logger.info("🚀 TRANSACTION TRIGGERED!")

    logger.info("=" * 60)

    logger.info("⚠  SIMULATED TRANSACTION (placeholder)")

    logger.info("=" * 60)

    logger.info("To enable real transactions:")

    logger.info("1. Install web3: pip install web3")

    logger.info("2. Configure RPC endpoint")

    logger.info("3. Add private key (use environment variables!)")

    logger.info("4. Implement transaction in send_transaction() function")

    logger.info("=" * 60)

    

    # Simulate transaction processing

    time.sleep(2)

    logger.info("✅ Transaction simulation complete")

    return True

# ============================

# MONITORING LOOP

# ============================

def monitor_and_execute(monitor: GasFeeMonitor):

    """Continuously monitor gas fees and execute transactions when conditions met"""

    logger.info("=" * 60)

    logger.info("STARTING LIVE MONITORING MODE")

    logger.info(f"Threshold: {monitor.threshold_mean:.4f} Gwei")

    logger.info("=" * 60)

    

    transaction_sent = False

    

    try:

        while not transaction_sent:

            current_record = monitor.fetch_gas_fee()

            

            if current_record is None:

                logger.warning("Failed to fetch current fee, retrying...")

                time.sleep(monitor.config["retry_wait"])

                continue

            

            current_fee = current_record.suggested_max_fee

            threshold = monitor.threshold_mean

            

            logger.info(f"Current: {current_fee:.4f} Gwei | Threshold: {threshold:.4f} Gwei | "

                       f"Diff: {current_fee - threshold:+.4f} Gwei")

            

            if monitor.should_send_transaction(current_fee):

                logger.info("✅ CONDITION MET: Current fee < Threshold")

                transaction_sent = send_transaction()

            else:

                logger.info(f"⏳ WAITING: Current fee >= Threshold (retry in {monitor.config['retry_wait']}s)")

                time.sleep(monitor.config["retry_wait"])

                

    except KeyboardInterrupt:

        logger.info("\n🛑 Monitoring stopped by user")


def monitor_realtime(monitor: GasFeeMonitor):

    """Continuously monitor and write gas fees to JSON for backend consumption"""

    logger.info("=" * 60)

    logger.info("STARTING REAL-TIME MONITORING MODE (Backend Integration)")

    logger.info(f"Writing to: {monitor.config['json_filename']}")

    logger.info("=" * 60)

    

    try:

        while True:

            current_record = monitor.fetch_gas_fee()

            

            if current_record is None:

                logger.warning("Failed to fetch current fee, retrying...")

                time.sleep(monitor.config["retry_wait"])

                continue

            

            # Sleep until next fetch

            time.sleep(monitor.config["fetch_interval"])

                

    except KeyboardInterrupt:

        logger.info("\n🛑 Real-time monitoring stopped by user")

# ============================

# MAIN EXECUTION

# ============================

def main():

    """Main execution flow"""

    logger.info("=" * 60)

    logger.info("GAS FEE MONITOR & SMART TRANSACTION TRIGGER")

    logger.info("=" * 60)

    

    # Initialize monitor

    monitor = GasFeeMonitor(CONFIG)

    

    try:

        # Phase 1: Collect baseline data (30 minutes)

        monitor.collect_baseline_data()

        

        # Phase 2: Calculate threshold

        threshold = monitor.calculate_threshold()

        

        # Phase 3: Export data (optional)

        monitor.export_to_csv()

        

        # Phase 4: Live monitoring and transaction execution

        monitor_and_execute(monitor)

        

    except KeyboardInterrupt:

        logger.info("\n🛑 Program interrupted by user")

    except Exception as e:

        logger.error(f"Fatal error: {e}", exc_info=True)

    finally:

        logger.info("=" * 60)

        logger.info("PROGRAM TERMINATED")

        logger.info(f"Total samples collected: {len(monitor.fee_records)}")

        logger.info("=" * 60)

if __name__ == "__main__":

    import sys

    # Check if running in real-time mode (for backend integration)

    if len(sys.argv) > 1 and sys.argv[1] == "--realtime":

        logger.info("=" * 60)

        logger.info("GAS FEE MONITOR - REAL-TIME MODE")

        logger.info("=" * 60)

        monitor = GasFeeMonitor(CONFIG)

        monitor_realtime(monitor)

    else:

        # Original main execution flow

        main()

