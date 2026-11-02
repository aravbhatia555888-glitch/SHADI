#!/usr/bin/env node

/**
 * Codebase Validation Script for ShaadiBazaar
 * Validates all APIs, schemas, and configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ShaadiBazaar Codebase Validation');
console.log('=====================================\n');

// Check if all required files exist
function checkRequiredFiles() {
  console.log('📁 Checking required files...');
  
  const requiredFiles = [
    'config/supabase.ts',
    'stores/auth-store.ts',
    'stores/wedding-store.ts',
    'stores/vendor-store.ts',
    'schemas/auth.ts',
    'schemas/wedding.ts',
    'types/supabase.ts',
    'mocks/vendors.ts',
    'utils/api-validator.ts',
    'supabase-setup.sql',
    'package.json',
    '.env.example'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Check package.json dependencies
function checkDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'zod',
    'zustand',
    '@react-native-async-storage/async-storage',
    'expo',
    'react',
    'react-native'
  ];
  
  let allDepsInstalled = true;
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allDepsInstalled = false;
    }
  });
  
  return allDepsInstalled;
}

// Parse KEY=VALUE pairs, ignoring comments and blank lines.
function parseEnv(content) {
  const env = {};
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  });
  return env;
}

// A value that still looks like the shipped example is not configured. This is
// the check that previously let placeholder credentials pass as "ready".
function isPlaceholderValue(value) {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  return /your[-_]|yourproject|placeholder|example|changeme|xxxx|sk-proj-|^<.*>$/i.test(v);
}

// Check environment configuration
function checkEnvironment() {
  console.log('\n🔧 Checking environment configuration...');

  const envExamplePath = path.join(__dirname, '..', '.env.example');
  const envPath = path.join(__dirname, '..', '.env');

  if (fs.existsSync(envExamplePath)) {
    console.log('✅ .env.example exists');
  } else {
    console.log('❌ .env.example missing');
    return false;
  }

  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env not found (copy from .env.example)');
    return false;
  }

  console.log('✅ .env exists');

  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];

  let hasAllVars = true;
  requiredVars.forEach(varName => {
    const value = env[varName];
    if (value === undefined) {
      console.log(`❌ ${varName} missing`);
      hasAllVars = false;
    } else if (isPlaceholderValue(value)) {
      console.log(`❌ ${varName} is still a placeholder — set a real value`);
      hasAllVars = false;
    } else {
      console.log(`✅ ${varName} configured`);
    }
  });

  return hasAllVars;
}

// Check API implementations
function checkAPIImplementations() {
  console.log('\n🚀 Checking API implementations...');
  
  const implementations = [
    {
      name: 'Authentication APIs',
      file: 'stores/auth-store.ts',
      methods: ['signIn', 'signUp', 'resetPassword', 'updateProfile', 'changePassword', 'deleteAccount']
    },
    {
      name: 'Wedding Planning APIs',
      file: 'stores/wedding-store.ts',
      methods: ['setWeddingDetails', 'loadVendors', 'searchVendors', 'toggleFavoriteVendor', 'loadChecklistItems', 'addChecklistItem', 'loadBudgetItems', 'addBudgetExpense']
    },
    {
      name: 'Vendor Discovery APIs',
      file: 'stores/vendor-store.ts',
      methods: ['loadVendors', 'loadMoreVendors', 'searchVendors', 'getVendorById', 'toggleFavoriteVendor']
    },
    {
      name: 'Review APIs',
      file: 'stores/review-store.ts',
      methods: ['addVendorReview', 'updateVendorReview', 'deleteVendorReview']
    },
    {
      name: 'Booking APIs',
      file: 'stores/booking-store.ts',
      methods: ['createBooking', 'checkVendorAvailability', 'updateBookingStatus', 'cancelBooking']
    },
    {
      name: 'Inquiry APIs',
      file: 'stores/inquiry-store.ts',
      methods: ['sendInquiry', 'loadUserInquiries', 'replyToInquiry', 'deleteInquiry']
    }
  ];
  
  let allImplemented = true;
  
  implementations.forEach(impl => {
    console.log(`\n📋 ${impl.name}:`);
    const filePath = path.join(__dirname, '..', impl.file);
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      impl.methods.forEach(method => {
        if (fileContent.includes(`${method}:`)) {
          console.log(`  ✅ ${method}`);
        } else {
          console.log(`  ❌ ${method} - NOT IMPLEMENTED`);
          allImplemented = false;
        }
      });
    } else {
      console.log(`  ❌ File not found: ${impl.file}`);
      allImplemented = false;
    }
  });
  
  return allImplemented;
}

// Check database schema
function checkDatabaseSchema() {
  console.log('\n🗄️  Checking database schema...');
  
  const schemaPath = path.join(__dirname, '..', 'supabase-setup.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ supabase-setup.sql not found');
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const requiredTables = [
    'profiles',
    'vendors',
    'vendor_reviews',
    'vendor_bookings',
    'vendor_inquiries',
    'checklist_items',
    'budget_items',
    'budget_expenses',
    'wedding_details',
    'favorite_vendors'
  ];
  
  let allTablesPresent = true;
  
  requiredTables.forEach(table => {
    if (schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`✅ ${table} table`);
    } else {
      console.log(`❌ ${table} table - MISSING`);
      allTablesPresent = false;
    }
  });
  
  return allTablesPresent;
}

// Check SQL migrations are consistent with the code that calls them
function checkSqlMigrations() {
  console.log('\n🗄️  Checking SQL migrations vs. store calls...');

  const root = __dirname + '/..';

  // (a) Every root-level migration SQL file must be listed in the README
  const readmePath = path.join(root, 'supabase', 'migrations', 'README.md');
  const readme = fs.existsSync(readmePath)
    ? fs.readFileSync(readmePath, 'utf8')
    : '';

  const sqlFiles = fs
    .readdirSync(root)
    .filter((f) => f.endsWith('.sql') && f.startsWith('supabase-'))
    .sort();

  let readmeOk = true;
  sqlFiles.forEach((file) => {
    if (readme.includes(file)) {
      console.log(`✅ ${file} listed in migrations README`);
    } else {
      console.log(`❌ ${file} NOT listed in supabase/migrations/README.md`);
      readmeOk = false;
    }
  });

  // (b) Every supabase.rpc("name") call in stores must exist in a migration file
  const storesDir = path.join(root, 'stores');
  let rpcCallOk = true;
  const rpcCalls = new Set();
  if (fs.existsSync(storesDir)) {
    fs.readdirSync(storesDir)
      .filter((f) => f.endsWith('.ts'))
      .forEach((file) => {
        const content = fs.readFileSync(path.join(storesDir, file), 'utf8');
        const regex = /supabase\.rpc\("([^"]+)"/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          rpcCalls.add(match[1]);
        }
      });
  }

  const allSql = sqlFiles
    .map((f) => {
      const p = path.join(root, f);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    })
    .join('\n');

  rpcCalls.forEach((rpc) => {
    if (allSql.includes(`CREATE OR REPLACE FUNCTION ${rpc}`)) {
      console.log(`✅ RPC ${rpc} defined in migrations`);
    } else {
      console.log(`❌ RPC ${rpc} called in stores but NOT defined in any migration`);
      rpcCallOk = false;
    }
  });

  return readmeOk && rpcCallOk;
}

// Generate validation report
function generateReport(results) {
  console.log('\n📊 CODEBASE CHECK');
  console.log('=================');
  
  const checks = [
    { name: 'Required Files', result: results.files },
    { name: 'Dependencies', result: results.dependencies },
    { name: 'API Implementations', result: results.apis },
    { name: 'Database Schema', result: results.database },
    { name: 'SQL Migrations', result: results.migrations }
  ];
  
  let overallScore = 0;
  
  checks.forEach(check => {
    console.log(`${check.name}: ${check.result ? '✅ PASS' : '❌ FAIL'}`);
    if (check.result) overallScore++;
  });
  
  const percentage = Math.round((overallScore / checks.length) * 100);
  
  // Environment is advisory: CI has no credentials and local devs may not have
  // a real .env yet. A placeholder .env is reported clearly but never fails the
  // code-consistency gate.
  console.log(
    `Environment: ${results.environment ? '✅ configured' : '⚠️  not configured (advisory — see above)'}`
  );
  
  console.log(`\nCode checks passed: ${overallScore}/${checks.length} (${percentage}%)`);
  console.log('\nℹ️  These are automated static checks only. They do NOT prove');
  console.log('    production readiness — they confirm the files, dependencies,');
  console.log('    APIs, schema and migration references are internally consistent.');
  
  if (percentage === 100) {
    console.log('\n✅ All automated codebase checks passed.');
  } else if (percentage >= 80) {
    console.log('\n⚠️  Almost there — fix the failing checks above.');
  } else {
    console.log('\n❌ Needs work — fix the failing checks above.');
  }
  
  console.log('\nManual steps before launch (NOT verifiable by this script):');
  console.log('  1. Set real Supabase credentials in .env');
  console.log('  2. Apply migrations and seed data to the Supabase project');
  console.log('  3. Deploy Edge Functions (ai-proxy, razorpay, delete-user-account)');
  console.log('  4. Configure EXPO_PUBLIC_AI_PROXY_URL, Razorpay keys and Sentry DSN');
  console.log('  5. Build native apps with EAS and test on real iOS/Android devices');
  console.log('  6. Exercise auth, booking, payment and chat flows end-to-end');
  
  return percentage;
}

// Main validation function
function runValidation() {
  const results = {
    files: checkRequiredFiles(),
    dependencies: checkDependencies(),
    environment: checkEnvironment(),
    apis: checkAPIImplementations(),
    database: checkDatabaseSchema(),
    migrations: checkSqlMigrations()
  };
  
  const score = generateReport(results);
  
  // Create validation report file
  const reportPath = path.join(__dirname, '..', 'VALIDATION_REPORT.md');
  const reportContent = `# ShaadiBazaar Codebase Check

Generated on: ${new Date().toISOString()}

This report covers automated **static** checks only. A passing score is **not**
a statement of production readiness.

## Code Checks

- **Required Files**: ${results.files ? '✅ PASS' : '❌ FAIL'}
- **Dependencies**: ${results.dependencies ? '✅ PASS' : '❌ FAIL'}
- **API Implementations**: ${results.apis ? '✅ PASS' : '❌ FAIL'}
- **Database Schema**: ${results.database ? '✅ PASS' : '❌ FAIL'}
- **SQL Migrations**: ${results.migrations ? '✅ PASS' : '❌ FAIL'}

## Code Checks Passed: ${score}%

${score === 100 ? '✅ All automated codebase checks passed.' : score >= 80 ? '⚠️ Almost there — fix the failing checks above.' : '❌ Needs work — fix the failing checks above.'}

## Environment (advisory — does not fail the gate)

- **Environment**: ${results.environment ? '✅ configured' : '⚠️ NOT configured (placeholder or missing Supabase credentials)'}

## Manual steps before launch (NOT verifiable by this script)

1. Set real Supabase credentials in .env (placeholder values now fail the Environment check).
2. Apply migrations and seed data to the Supabase project.
3. Deploy Edge Functions (ai-proxy, razorpay checkout/verify, delete-user-account).
4. Configure EXPO_PUBLIC_AI_PROXY_URL, Razorpay keys and Sentry DSN.
5. Build native apps with EAS and test on real iOS/Android devices.
6. Exercise auth, booking, payment and chat flows end-to-end.
`;
  
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`\n📄 Validation report saved: VALIDATION_REPORT.md`);
  
  return score;
}

// Run validation if called directly
if (require.main === module) {
  const score = runValidation();
  if (score !== 100) process.exitCode = 1;
}

module.exports = { runValidation };
