const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local manually since we don't have dotenv
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseKey = keyMatch[1].trim();
} catch (error) {
    console.error('Error reading .env.local:', error.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL not found');
    if (!supabaseKey) console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
    process.exit(1);
}

console.log(`Checking connection to: ${supabaseUrl}`);

const req = https.request(`${supabaseUrl}/auth/v1/health`, { method: 'GET' }, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('Connection successful!');
    } else {
        console.log('Connection failed or project paused.');
    }
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
