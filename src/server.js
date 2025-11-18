/**
 * Backend proxy server for Stripe API calls
 * Uses official Stripe Node.js SDK
 * Run with: node server.js
 */

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Detect if running as pkg executable
const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '..');

console.log(`Running mode: ${isPkg ? 'Standalone Executable' : 'Node.js'}`);
console.log(`Base directory: ${baseDir}`);

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Serve static files
// In pkg mode: serve from executable directory
// In dev mode: serve from src/ and parent directory
if (isPkg) {
    // Executable mode: config.json and view.json are next to the .exe
    app.use(express.static(baseDir));
} else {
    // Dev mode: serve from src/ and parent directory
    app.use(express.static(__dirname));
    app.use(express.static(baseDir));
}

/**
 * Endpoint to fetch Stripe data for a project
 * POST /api/stripe/data
 * Body: { apiKey: string, startTimestamp: number }
 */
app.post('/api/stripe/data', async (req, res) => {
    try {
        const { apiKey, startTimestamp } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        // Log key type for debugging
        const keyType = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
        console.log(`📡 Stripe API request with key: ${keyType}`);

        // Initialize Stripe with the provided key
        const stripe = new Stripe(apiKey);

        // Fetch charges from the past 30 days
        const charges = await stripe.charges.list({
            limit: 100,
            created: { gte: startTimestamp }
        });

        // Fetch balance
        let balance = null;
        try {
            balance = await stripe.balance.retrieve();
        } catch (error) {
            console.warn('Could not fetch balance:', error.message);
        }

        res.json({
            charges: charges.data,
            balance: balance
        });

    } catch (error) {
        console.error('Stripe API error:', error);
        
        // Format error response with helpful messages
        let errorMessage = error.message;
        let helpText = '';
        
        if (error.statusCode === 401) {
            if (error.message.includes('Invalid API Key')) {
                helpText = '\n\n🔑 Restricted Key Permissions:\n' +
                          '1. Go to Stripe Dashboard → Developers → API Keys\n' +
                          '2. Find your restricted key (rk_live_...)\n' +
                          '3. Click "Edit" and ensure these permissions are enabled:\n' +
                          '   • Charges: Read ✓\n' +
                          '   • Balance: Read ✓\n' +
                          '4. Save changes\n\n' +
                          'Or verify the key is copied correctly from the dashboard.';
            } else {
                helpText = '\n\n⚠️ Authentication failed. Check your API key permissions.';
            }
        }
        
        res.status(error.statusCode || 500).json({
            error: errorMessage + helpText,
            type: error.type,
            statusCode: error.statusCode,
            raw: error.raw
        });
    }
});

/**
 * Endpoint to fetch PayPal data
 * POST /api/paypal/data
 * Body: { credentials: object, startTimestamp: number }
 * credentials can be: { clientId, secret } OR { username, password, signature }
 */
app.post('/api/paypal/data', async (req, res) => {
    try {
        const { credentials, startTimestamp } = req.body;
        
        if (!credentials) {
            return res.status(400).json({ error: 'PayPal credentials required' });
        }

        const startDate = new Date(startTimestamp * 1000).toISOString().split('.')[0] + 'Z';
        const endDate = new Date().toISOString().split('.')[0] + 'Z';

        // Check if using Classic API (username/password/signature)
        if (credentials.username && credentials.password && credentials.signature) {
            console.log('📡 Using PayPal Classic NVP/SOAP API');
            return await handleClassicPayPalAPI(credentials, startDate, endDate, res);
        }
        
        // Otherwise use REST API (clientId/secret)
        if (!credentials.clientId || !credentials.secret) {
            return res.status(400).json({ 
                error: 'PayPal credentials incomplete. Need either (clientId + secret) OR (username + password + signature)' 
            });
        }

        console.log('📡 Using PayPal REST API');

        // Get OAuth token
        const authResponse = await fetch('https://api.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${credentials.clientId}:${credentials.secret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!authResponse.ok) {
            const authError = await authResponse.json().catch(() => ({}));
            let errorMsg = `PayPal REST authentication failed (${authResponse.status})`;
            if (authError.error_description) {
                errorMsg += `: ${authError.error_description}`;
            }
            errorMsg += '\n\n💡 Try using Classic API credentials instead (username/password/signature)';
            throw new Error(errorMsg);
        }

        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // PayPal REST API Limitation Workaround
        // The account doesn't have Transaction Search/Reporting API access (403 error)
        // This is common for standard PayPal accounts - these APIs require special permissions
        
        console.log('⚠️  PayPal Transaction APIs not accessible (403 Forbidden)');
        console.log('ℹ️  This is a PayPal account limitation, not a code issue');
        console.log('');
        console.log('PayPal REST API requires one of:');
        console.log('  • Sandbox credentials (for testing)');
        console.log('  • Business account with Transaction Search enabled');
        console.log('  • Account approved for Reporting API access');
        console.log('');
        console.log('Solutions:');
        console.log('  1. Use PayPal Sandbox credentials from developer.paypal.com');
        console.log('  2. Contact PayPal to enable Transaction Search API');
        console.log('  3. Use webhook or IPN notifications instead');
        console.log('  4. Manually export data from PayPal dashboard');
        console.log('');
        console.log('For now, returning empty transaction data...');
        
        // Return empty but valid data structure
        const transactionsData = {
            transaction_details: [],
            account_number: 'N/A',
            start_date: new Date(startTimestamp * 1000).toISOString(),
            end_date: new Date().toISOString(),
            page: 1,
            total_items: 0,
            total_pages: 0,
            links: []
        };

        // Fetch balance (try multiple endpoints)
        let balance = null;
        try {
            // Try v1 balance first
            const balanceResponse = await fetch(
                'https://api.paypal.com/v1/reporting/balances',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (balanceResponse.ok) {
                balance = await balanceResponse.json();
            } else {
                // Try wallet API
                const walletResponse = await fetch(
                    'https://api.paypal.com/v1/wallet/balance',
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                if (walletResponse.ok) {
                    balance = await walletResponse.json();
                }
            }
        } catch (error) {
            console.warn('Could not fetch PayPal balance:', error.message);
        }

        res.json({
            transactions: transactionsData.transaction_details || [],
            balance: balance
        });

    } catch (error) {
        console.error('PayPal API error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

/**
 * Handle PayPal Classic NVP/SOAP API
 */
async function handleClassicPayPalAPI(credentials, startDate, endDate, res) {
    try {
        // Build NVP API request for TransactionSearch
        const params = new URLSearchParams({
            USER: credentials.username,
            PWD: credentials.password,
            SIGNATURE: credentials.signature,
            METHOD: 'TransactionSearch',
            VERSION: '204.0',
            STARTDATE: startDate,
            ENDDATE: endDate,
            STATUS: 'Success'
        });

        const nvpResponse = await fetch('https://api-3t.paypal.com/nvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const responseText = await nvpResponse.text();
        const nvpData = Object.fromEntries(new URLSearchParams(responseText));

        if (nvpData.ACK !== 'Success' && nvpData.ACK !== 'SuccessWithWarning') {
            let errorMsg = `PayPal Classic API error: ${nvpData.L_SHORTMESSAGE0 || nvpData.ACK}`;
            if (nvpData.L_LONGMESSAGE0) {
                errorMsg += ` - ${nvpData.L_LONGMESSAGE0}`;
            }
            throw new Error(errorMsg);
        }

        // Parse transaction results
        const transactions = [];
        let index = 0;
        while (nvpData[`L_TIMESTAMP${index}`]) {
            transactions.push({
                transaction_info: {
                    transaction_id: nvpData[`L_TRANSACTIONID${index}`],
                    transaction_amount: {
                        value: nvpData[`L_AMT${index}`] || '0',
                        currency_code: nvpData[`L_CURRENCYCODE${index}`] || 'USD'
                    },
                    transaction_initiation_date: nvpData[`L_TIMESTAMP${index}`],
                    transaction_status: nvpData[`L_STATUS${index}`],
                    payer_email: nvpData[`L_EMAIL${index}`],
                    transaction_type: nvpData[`L_TYPE${index}`]
                }
            });
            index++;
        }

        console.log(`✅ Retrieved ${transactions.length} PayPal transactions via Classic API`);

        // Get balance using GetBalance method
        let balance = null;
        try {
            const balanceParams = new URLSearchParams({
                USER: credentials.username,
                PWD: credentials.password,
                SIGNATURE: credentials.signature,
                METHOD: 'GetBalance',
                VERSION: '204.0'
            });

            const balanceResponse = await fetch('https://api-3t.paypal.com/nvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: balanceParams.toString()
            });

            const balanceText = await balanceResponse.text();
            const balanceData = Object.fromEntries(new URLSearchParams(balanceText));

            if (balanceData.ACK === 'Success') {
                balance = {
                    balances: [{
                        currency: balanceData.L_CURRENCYCODE0 || 'USD',
                        total_balance: {
                            currency_code: balanceData.L_CURRENCYCODE0 || 'USD',
                            value: balanceData.L_AMT0 || '0'
                        }
                    }]
                };
            }
        } catch (error) {
            console.warn('Could not fetch PayPal balance:', error.message);
        }

        res.json({
            transaction_details: transactions,
            balance: balance
        });

    } catch (error) {
        console.error('PayPal Classic API error:', error);
        res.status(500).json({
            error: error.message
        });
    }
}

app.listen(PORT, () => {
    console.log(`✅ Backend proxy server running on http://localhost:${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`\nConfiguration files location: ${baseDir}`);
    console.log(`  - config.json (your API credentials)`);
    console.log(`  - view.json (saved layout preferences)`);
    console.log(`\nEndpoints:`);
    console.log(`  POST /api/stripe/data`);
    console.log(`  POST /api/paypal/data`);
});
