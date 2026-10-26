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
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env exists');
    
    // Check if .env has required variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    let hasAllVars = true;
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        console.log(`✅ ${varName} configured`);
      } else {
        console.log(`⚠️  ${varName} not configured`);
        hasAllVars = false;
      }
    });
    
    return hasAllVars;
  } else {
    console.log('⚠️  .env not found (copy from .env.example)');
    return false;
  }
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
  console.log('\n📊 VALIDATION REPORT');
  console.log('====================');
  
  const categories = [
    { name: 'Required Files', result: results.files },
    { name: 'Dependencies', result: results.dependencies },
    { name: 'Environment', result: results.environment },
    { name: 'API Implementations', result: results.apis },
    { name: 'Database Schema', result: results.database },
    { name: 'SQL Migrations', result: results.migrations }
  ];
  
  let overallScore = 0;
  
  categories.forEach(category => {
    const status = category.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${category.name}: ${status}`);
    if (category.result) overallScore++;
  });
  
  const percentage = Math.round((overallScore / categories.length) * 100);
  
  console.log(`\nOverall Score: ${overallScore}/${categories.length} (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('\n🎉 CONGRATULATIONS!');
    console.log('Your ShaadiBazaar codebase is 100% ready for production!');
    console.log('\n✅ All APIs implemented');
    console.log('✅ All dependencies installed');
    console.log('✅ Database schema complete');
    console.log('✅ SQL migrations consistent');
    console.log('✅ Environment configured');
    console.log('✅ All files present');
    console.log('\n🚀 Ready to deploy!');
  } else if (percentage >= 80) {
    console.log('\n⚠️  Almost ready! Fix the remaining issues.');
  } else {
    console.log('\n❌ Needs work. Please fix the issues above.');
  }
  
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
  const reportContent = `# ShaadiBazaar Validation Report

Generated on: ${new Date().toISOString()}

## Validation Results

- **Required Files**: ${results.files ? '✅ PASS' : '❌ FAIL'}
- **Dependencies**: ${results.dependencies ? '✅ PASS' : '❌ FAIL'}
- **Environment**: ${results.environment ? '✅ PASS' : '❌ FAIL'}
- **API Implementations**: ${results.apis ? '✅ PASS' : '❌ FAIL'}
- **Database Schema**: ${results.database ? '✅ PASS' : '❌ FAIL'}

## Overall Score: ${score}%

${score === 100 ? '🎉 **PRODUCTION READY!**' : score >= 80 ? '⚠️ **ALMOST READY**' : '❌ **NEEDS WORK**'}

## Next Steps

${score === 100 
  ? '1. Configure Supabase credentials in .env\n2. Run database setup script\n3. Start your app: npm start'
  : '1. Fix the failing validation items above\n2. Re-run validation: node scripts/validate-codebase.js\n3. Repeat until 100% ready'
}
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
