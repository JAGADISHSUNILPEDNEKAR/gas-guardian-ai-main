
import axios from 'axios';
import { ethers } from 'ethers';

const API_URL = 'http://localhost:8080/api';

async function main() {
    console.log('🚀 Starting GasGuard Backend Verification...');

    // 1. Create a random wallet for testing
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    console.log(`👤 Created test wallet: ${address}`);

    // 2. Login
    console.log('🔑 Attempting login...');
    const message = "Login to GasGuard";
    const signature = await wallet.signMessage(message);

    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            walletAddress: address,
            signature
        });

        if (!loginRes.data.success) {
            throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
        }

        const token = loginRes.data.data.token;
        console.log('✅ Login successful. Token received.');

        // 3. Schedule Transaction (The critical verification step)
        console.log('🛡️  Scheduling GasGuard execution...');

        // Simulate the payload exactly as the frontend sends it now (WITHOUT scaling)
        const payload = {
            transaction: {
                target: "0x0000000000000000000000000000000000000000",
                data: "0x",
                value: "0",
                type: "SWAP"
            },
            safetyParams: {
                maxGasPrice: 15,       // Gwei provided directly
                minFlrPrice: 0.02,     // USD provided directly
                maxSlippage: 0.5,
                deadline: Math.floor(Date.now() / 1000) + 3600
            },
            walletAddress: address
        };

        const scheduleRes = await axios.post(`${API_URL}/transactions/schedule`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (scheduleRes.data.success) {
            console.log('✅ Transaction scheduled successfully!');
            console.log('📝 Execution ID:', scheduleRes.data.data.executionId);
            console.log('💰 Estimated Savings:', scheduleRes.data.data.estimatedSavings);
            console.log('🎉 VERIFICATION PASSED: Backend accepted unscaled units correctly.');
        } else {
            throw new Error('Schedule failed: ' + JSON.stringify(scheduleRes.data));
        }

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

main();
