import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.OPENAI_API_KEY;
const isGroq = apiKey?.startsWith('gsk_');

console.log('API Key present:', !!apiKey);
console.log('Provider:', isGroq ? 'Groq' : 'OpenAI');
console.log('Key prefix:', apiKey?.substring(0, 10) + '...');

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined,
});

async function test() {
    try {
        console.log('\n🧪 Testing API connection...');

        const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
        console.log('Using model:', model);

        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful assistant. Respond in JSON format.' },
                { role: 'user', content: 'Say "test successful" in JSON format with a field called message' },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 100,
        });

        console.log('✅ API Test Successful!');
        console.log('Response:', completion.choices[0].message.content);

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        if (error.status === 401) {
            console.error('Invalid API key!');
        }
        if (error.status === 429) {
            console.error('Rate limit exceeded!');
        }
        if (error.code === 'ENOTFOUND') {
            console.error('Cannot reach API endpoint!');
        }
        console.error('Full error:', error);
    }
}

test();
