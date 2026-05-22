/**
 * build/build.js - Random Fingerprint Generator for cfnew-plus
 * 
 * This script randomizes route names, enum/constant names, header keys,
 * and WS path at build time to break fingerprint clustering by CF's automated systems.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PLAIN_JS_PATH = path.join(__dirname, '..', 'plain.js');
const OUTPUT_PATH = path.join(__dirname, '..', 'plain.js'); // Overwrite plain.js
const MAPPINGS_PATH = path.join(__dirname, 'mappings.json');

// Character sets for random string generation
const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

/**
 * Generate a random string of specified length
 */
function randomString(length, charset = ALPHANUMERIC) {
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
    }
    return result;
}

/**
 * Generate a random route path (e.g., "/a7f", "/x2k")
 */
function randomRoute() {
    const length = 3 + Math.floor(Math.random() * 3); // 3-5 chars
    return '/' + randomString(length, LOWERCASE);
}

/**
 * Generate a random constant name (2-6 chars)
 */
function randomConstant(maxLen = 6) {
    const length = 2 + Math.floor(Math.random() * (maxLen - 2));
    return randomString(length, LOWERCASE);
}

/**
 * Generate a random header key
 */
function randomHeader() {
    const prefixes = ['x-', 'cf-', 'cfx-', 'x' + randomString(1, LOWERCASE) + '-'];
    const suffix = randomString(2, LOWERCASE);
    return prefixes[Math.floor(Math.random() * prefixes.length)] + suffix;
}

/**
 * Generate a random WebSocket path (keeping ?ed=2048 format)
 */
function randomWsPath() {
    const paths = ['/live', '/socket', '/connect', '/v2', '/ws', '/data', '/sync', '/stream'];
    return paths[Math.floor(Math.random() * paths.length)];
}

/**
 * Generate a random JSON key
 */
function randomJsonKey(type) {
    const options = {
        'ip': ['addr', 'node', 'a', 'ipaddr', 'host'],
        'port': ['p', 'pt', 'port', 'svc'],
        'region': ['r', 'loc', 'reg', 'area']
    };
    const choices = options[type] || [randomConstant(3)];
    return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Generate all random mappings
 */
function generateMappings() {
    const mappings = {
        timestamp: new Date().toISOString(),
        routes: {},
        constants: {},
        headers: {},
        wsPath: {},
        jsonKeys: {}
    };

    // Route mappings
    mappings.routes['/sub'] = randomRoute();
    mappings.routes['/api/config'] = '/' + randomString(3, LOWERCASE) + '/' + randomString(4, LOWERCASE);
    mappings.routes['/api/preferred-ips'] = '/' + randomString(3, LOWERCASE) + '/' + randomString(5, LOWERCASE);
    mappings.routes['/?ed=2048'] = randomWsPath() + '?ed=2048';

    // Constant/Enum name mappings
    mappings.constants['vless'] = randomConstant(2);
    mappings.constants['trojan'] = randomConstant(2);
    mappings.constants['ws'] = randomConstant(2);
    mappings.constants['clash'] = randomConstant(2);
    mappings.constants['base64'] = randomConstant(3);
    mappings.constants['surge'] = randomConstant(2);
    mappings.constants['singbox'] = randomConstant(3);
    mappings.constants['quantumult'] = randomConstant(3);

    // Header key mappings
    mappings.headers['Content-Type'] = randomHeader();
    mappings.headers['X-Real-IP'] = randomHeader();
    mappings.headers['CF-Connecting-IP'] = randomHeader();

    // JSON key mappings
    mappings.jsonKeys['ip'] = randomJsonKey('ip');
    mappings.jsonKeys['port'] = randomJsonKey('port');
    mappings.jsonKeys['region'] = randomJsonKey('region');

    // Also map server -> random (for JSON response keys)
    mappings.jsonKeys['server'] = randomJsonKey('ip');

    // WS path base (without query)
    mappings.wsPath['/?ed=2048'] = randomWsPath() + '?ed=2048';

    return mappings;
}

/**
 * Apply all replacements to the source code
 */
function applyReplacements(source, mappings) {
    let result = source;

    // 1. Replace route paths
    for (const [original, replacement] of Object.entries(mappings.routes)) {
        // Only replace as complete path segments
        const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOriginal, 'g');
        result = result.replace(regex, replacement);
    }

    // 2. Replace constant/enum names (as string literals)
    for (const [original, replacement] of Object.entries(mappings.constants)) {
        // Replace 'original' as a string literal (quoted)
        const patterns = [
            new RegExp(`'${original}'`, 'g'),
            new RegExp(`"${original}"`, 'g'),
            new RegExp(`\`${original}\``, 'g')
        ];
        for (const pattern of patterns) {
            result = result.replace(pattern, `'${replacement}'`);
        }
        
        // Also replace protocol URLs like 'vless://' -> 'xx://'
        if (original === 'vless' || original === 'trojan') {
            const urlPattern = new RegExp(`'${original}://'`, 'g');
            result = result.replace(urlPattern, `'${replacement}://'`);
        }
    }

    // 3. Replace header keys
    for (const [original, replacement] of Object.entries(mappings.headers)) {
        // Match as object property key
        const patterns = [
            new RegExp(`'${original}'`, 'g'),
            new RegExp(`"${original}"`, 'g')
        ];
        for (const pattern of patterns) {
            result = result.replace(pattern, `'${replacement}'`);
        }
    }

    // 4. Replace JSON keys (property names in objects)
    for (const [original, replacement] of Object.entries(mappings.jsonKeys)) {
        // Replace property key format: "original": or 'original': or original:
        const patterns = [
            new RegExp(`"${original}":`, 'g'),
            new RegExp(`'${original}':`, 'g'),
            new RegExp(`${original}:`, 'g')
        ];
        for (const pattern of patterns) {
            result = result.replace(pattern, `"${replacement}":`);
        }
    }

    // 5. Replace WS path (/?ed=2048 pattern)
    for (const [original, replacement] of Object.entries(mappings.wsPath)) {
        const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOriginal, 'g');
        result = result.replace(regex, replacement);
    }

    return result;
}

/**
 * Validate that the result doesn't have obvious syntax errors
 */
function validateOutput(source) {
    // Basic checks
    const issues = [];
    
    // Check for unbalanced braces
    const openBraces = (source.match(/{/g) || []).length;
    const closeBraces = (source.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
        issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
    }
    
    // Check for unbalanced parentheses
    const openParens = (source.match(/\(/g) || []).length;
    const closeParens = (source.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        issues.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for common syntax error patterns
    if (source.includes("''") && !source.includes("'',")) {
        // Empty string followed by something that isn't a comma
    }
    
    return issues;
}

/**
 * Main build function
 */
function build() {
    console.log('🚀 Starting fingerprint randomization build...\n');

    // Read source file
    if (!fs.existsSync(PLAIN_JS_PATH)) {
        console.error(`❌ Source file not found: ${PLAIN_JS_PATH}`);
        process.exit(1);
    }

    const source = fs.readFileSync(PLAIN_JS_PATH, 'utf8');
    console.log(`📄 Read ${source.split('\n').length} lines from plain.js`);

    // Generate random mappings
    const mappings = generateMappings();
    console.log('\n📋 Generated random mappings:');
    console.log('   Routes:');
    for (const [k, v] of Object.entries(mappings.routes)) {
        console.log(`      ${k} → ${v}`);
    }
    console.log('   Constants:');
    for (const [k, v] of Object.entries(mappings.constants)) {
        console.log(`      ${k} → ${v}`);
    }
    console.log('   Headers:');
    for (const [k, v] of Object.entries(mappings.headers)) {
        console.log(`      ${k} → ${v}`);
    }
    console.log('   JSON Keys:');
    for (const [k, v] of Object.entries(mappings.jsonKeys)) {
        console.log(`      ${k} → ${v}`);
    }

    // Apply replacements
    const transformed = applyReplacements(source, mappings);
    console.log('\n✅ Applied all replacements');

    // Validate output
    const issues = validateOutput(transformed);
    if (issues.length > 0) {
        console.warn('\n⚠️  Potential issues detected:');
        issues.forEach(issue => console.warn(`   - ${issue}`));
    } else {
        console.log('✅ Output validation passed');
    }

    // Write transformed file
    fs.writeFileSync(OUTPUT_PATH, transformed, 'utf8');
    console.log(`\n💾 Wrote transformed plain.js`);

    // Write mappings file
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2), 'utf8');
    console.log(`💾 Wrote mappings to ${MAPPINGS_PATH}`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Build Summary');
    console.log('='.repeat(50));
    console.log(`   Source lines: ${source.split('\n').length}`);
    console.log(`   Output lines: ${transformed.split('\n').length}`);
    console.log(`   Routes randomized: ${Object.keys(mappings.routes).length}`);
    console.log(`   Constants randomized: ${Object.keys(mappings.constants).length}`);
    console.log(`   Headers randomized: ${Object.keys(mappings.headers).length}`);
    console.log(`   JSON keys randomized: ${Object.keys(mappings.jsonKeys).length}`);
    console.log('='.repeat(50));
    console.log('✅ Fingerprint randomization complete!');
    console.log('\nNext steps:');
    console.log('   1. Review the transformed plain.js');
    console.log('   2. Run: node obfuscate.js');
    console.log('   3. Deploy worker.js to Cloudflare\n');

    return mappings;
}

// Run build
if (require.main === module) {
    build();
}

module.exports = { generateMappings, applyReplacements, validateOutput };
