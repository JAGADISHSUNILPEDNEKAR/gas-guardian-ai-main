import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

async function testExecutionMonitor() {
    console.log('🧪 Starting Execution Monitor API Test...');

    try {
        // 1. Need to login first to get a token.
        // This is tricky without a wallet signature.
        // We will assume the user can provide a valid token or we skip auth if we disabled it for testing (we didn't).

        // HOWEVER, for this test script, we can try to hit the health endpoint first.
        console.log('Checking API health...');
        const health = await axios.get(`${API_URL}/health`);
        console.log('✅ Health Check:', health.data);

        // 2. Try to fetch transactions without token (should fail 401)
        console.log('\nTesting Unauthorized Access...');
        try {
            await axios.get(`${API_URL}/transactions`);
            console.error('❌ Failed: Should have returned 401');
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly returned 401 Unauthorized');
            } else {
                console.error('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n⚠️ NOTE: To fully test, you need a valid JWT token.');
        console.log('Run the frontend, connect wallet, and check the network tab for the /transactions request.');

    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection refused! Is the backend server running on port 8080?');
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

testExecutionMonitor();
