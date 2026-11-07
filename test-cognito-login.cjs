#!/usr/bin/env node

/**
 * API Integration Test with Cognito Login
 *
 * Logs in to Cognito using a known user, retrieves tokens via ADMIN_USER_PASSWORD_AUTH,
 * then exercises protected API routes with the AccessToken.
 *
 * Usage:
 *   AWS_PROFILE=mvp node test-cognito-login.cjs [--email user] [--password pass] [--region us-east-1]
 *   or set env TEST_EMAIL / TEST_PASSWORD. Falls back to trying known passwords if not provided.
 */

const https = require('https');
const AWS = require('aws-sdk');

const colors = {
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m', reset: '\x1b[0m', bold: '\x1b[1m'
};
function log(msg, color=''){ console.log(`${color}${msg}${colors.reset}`); }

const argv = process.argv.slice(2);
function getArg(name, def){ const i = argv.indexOf(name); return i !== -1 ? argv[i+1] : def; }

const region = getArg('--region', process.env.AWS_REGION || 'us-east-1');
const profile = process.env.AWS_PROFILE || getArg('--profile', 'mvp');

// Cognito configuration
const userPoolId = 'us-east-1_bKshBMVth';
const clientId = '3sqlej98hh2s5vo117ha3hg0i4';
const email = getArg('--email', process.env.TEST_EMAIL || 'priorww@gmail.com');
const suppliedPassword = getArg('--password', process.env.TEST_PASSWORD);

const apiBase = 'https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod';

AWS.config.update({ region });
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
const cognito = new AWS.CognitoIdentityServiceProvider();

async function adminLogin(username, password){
  const resp = await cognito.adminInitiateAuth({
    UserPoolId: userPoolId,
    ClientId: clientId,
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: username, PASSWORD: password }
  }).promise();
  return resp.AuthenticationResult || {};
}

function request(url, options={}){
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname + u.search,
      method: options.method || 'GET', headers: { 'Accept': 'application/json', ...(options.headers||{}) }
    }, res => {
      let data='';
      res.on('data', c => data += c);
      res.on('end', () => {
        let body = data; let json = null;
        try { json = data ? JSON.parse(data) : null; } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data: json, body });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testGet(name, path, token){
  const res = await request(`${apiBase}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status !== 200){ throw new Error(`${name}: expected 200, got ${res.status}. Body: ${res.body?.slice?.(0,200)}`); }
  log(`200 ${name}`, colors.green);
}

async function main(){
  log(`${colors.bold}🔐 Cognito Login + API Integration Test${colors.reset}`);
  log(`Region: ${region}  Profile: ${profile}`);
  log(`User: ${email}`);

  if (!suppliedPassword){
    log('❌ Missing password. Provide via --password or TEST_PASSWORD env.', colors.red);
    log('   Example: TEST_PASSWORD="<one-of-two-known-passwords>" npm run test:auth', colors.yellow);
    process.exit(1);
  }

  log(`Attempting login...`, colors.blue);
  const result = await adminLogin(email, suppliedPassword);

  const id = result.IdToken?.slice(0,20) || 'n/a';
  const at = result.AccessToken?.slice(0,20) || 'n/a';
  log(`✅ Logged in. IdToken: ${id}...  AccessToken: ${at}...`, colors.green);

  const accessToken = result.AccessToken;
  const idToken = result.IdToken;

  function decodeJwt(token){
    try { const [,p] = token.split('.'); return JSON.parse(Buffer.from(p,'base64').toString('utf8')); } catch { return null; }
  }
  const idPayload = idToken ? decodeJwt(idToken) : null;
  const atPayload = accessToken ? decodeJwt(accessToken) : null;
  if (idPayload){
    log(`IdToken: iss=${idPayload.iss} aud=${idPayload.aud} token_use=${idPayload.token_use}`, colors.blue);
  }
  if (atPayload){
    log(`AccessToken: iss=${atPayload.iss} client_id=${atPayload.client_id} token_use=${atPayload.token_use} scope=${atPayload.scope}`, colors.blue);
  }

  async function runChecks(token, label){
    log(`\nUsing ${label} for API calls`, colors.blue);
    await testGet('GET /credits/balance', '/credits/balance', token);
    await testGet('GET /projects', '/projects', token);
    await testGet('GET /reports', '/reports', token);
    await testGet('GET /ideations', '/ideations', token);
    await testGet('GET /double-downs', '/double-downs', token);
  }

  try {
    await runChecks(accessToken, 'AccessToken');
    log(`${colors.bold}🎉 All authenticated GET checks passed (AccessToken)${colors.reset}`);
  } catch (e) {
    log(`⚠️ AccessToken checks failed: ${e.message}`, colors.yellow);
    if (idToken) {
      log(`Retrying with IdToken...`, colors.yellow);
      await runChecks(idToken, 'IdToken');
      log(`${colors.bold}🎉 All authenticated GET checks passed (IdToken)${colors.reset}`);
    } else {
      throw e;
    }
  }
}

if (require.main === module) {
  main().catch(err => { log(`Fatal error: ${err.message}`, colors.red); process.exit(1); });
}

module.exports = { main };
