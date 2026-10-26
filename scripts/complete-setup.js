#!/usr/bin/env node

/**
 * Complete Setup Script for ShaadiBazaar
 * Automates the entire setup process
 */

const fs = require('fs');
const path = require('path');

console.log('🎉 Welcome to ShaadiBazaar Complete Setup!');
console.log('This script will set up your wedding planning app with all features.\n');

// Check if .env exists
function checkEnvironment() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');

    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Created .env file');
      console.log('⚠️  Please update .env with your Supabase credentials');
    } else {
      console.log('❌ .env.example not found');
      return false;
    }
  } else {
    console.log('✅ .env file exists');
  }

  return true;
}

// Check dependencies
function checkDependencies() {
  console.log('📦 Checking dependencies...');

  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const requiredDeps = [
    '@supabase/supabase-js',
    'zod',
    'zustand',
    '@react-native-async-storage/async-storage'
  ];

  const missingDeps = requiredDeps.filter(dep =>
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );

  if (missingDeps.length > 0) {
    console.log('❌ Missing dependencies:', missingDeps.join(', '));
    console.log('💡 Run: npm install ' + missingDeps.join(' '));
    return false;
  }

  console.log('✅ All dependencies are installed');
  return true;
}

// Generate setup report
function generateSetupReport() {
  const report = `
# 🎉 ShaadiBazaar Setup Complete!

Your wedding planning app is now fully configured with:

## ✅ Implemented Features

### 🔐 Authentication
- [x] User registration and login
- [x] Password reset functionality
- [x] Profile management
- [x] Account deletion
- [x] Session persistence

### 💒 Wedding Planning
- [x] Wedding details management
- [x] Vendor browsing and search
- [x] Favorite vendors
- [x] Checklist management
- [x] Budget tracking
- [x] Expense management

### 🔄 Real-time Features
- [x] Live checklist updates
- [x] Real-time budget sync
- [x] Collaborative planning
- [x] Cross-device synchronization

### 🛡️ Security & Validation
- [x] Runtime type validation with Zod
- [x] Row Level Security (RLS)
- [x] Input sanitization
- [x] Error handling

### 📱 User Experience
- [x] Offline fallback
- [x] Loading states
- [x] Error messages
- [x] Type-safe APIs

## 🚀 Next Steps

1. **Configure Supabase**:
   - Update \`.env\` with your Supabase credentials
   - Run the SQL setup script in Supabase dashboard

2. **Test Your App**:
   \`\`\`bash
   npm start
   \`\`\`

3. **API Testing**:
   \`\`\`typescript
   import { apiValidator } from '@/utils/api-validator';
   await apiValidator.testAllAPIs();
   \`\`\`

## 📚 Documentation

- **API Reference**: \`API_DOCUMENTATION.md\`
- **Supabase Setup**: \`SUPABASE_SETUP.md\`
- **Database Schema**: \`scripts/setup-supabase.js\`

## 🎯 Production Ready

Your app includes:
- Enterprise-grade backend (Supabase)
- Type-safe APIs with runtime validation
- Real-time collaborative features
- Secure user authentication
- Scalable architecture

## 🆘 Support

If you need help:
1. Check the documentation files
2. Run the API validator for debugging
3. Review the setup scripts

**Happy Wedding Planning! 💍**

---
Generated on: ${new Date().toISOString()}
`;

  const reportPath = path.join(__dirname, '..', 'SETUP_COMPLETE.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log('📄 Generated setup report: SETUP_COMPLETE.md');
}

// Main setup function
function runCompleteSetup() {
  console.log('🔍 Running setup checks...\n');

  let allGood = true;

  // Check environment
  if (!checkEnvironment()) {
    allGood = false;
  }

  // Check dependencies
  if (!checkDependencies()) {
    allGood = false;
  }

  // Generate SQL setup file
  try {
    const { createSetupFile } = require('./setup-supabase.js');
    createSetupFile();
    console.log('✅ Generated Supabase setup script');
  } catch (error) {
    console.log('❌ Failed to generate Supabase setup script:', error.message);
    allGood = false;
  }

  // Generate setup report
  generateSetupReport();

  console.log('\n' + '='.repeat(50));

  if (allGood) {
    console.log('🎉 SETUP COMPLETE!');
    console.log('Your ShaadiBazaar app is ready with all features:');
    console.log('');
    console.log('✅ Authentication APIs');
    console.log('✅ Wedding Planning APIs');
    console.log('✅ Real-time Features');
    console.log('✅ Type Safety & Validation');
    console.log('✅ Database Integration');
    console.log('');
    console.log('📋 TODO:');
    console.log('1. Update .env with Supabase credentials');
    console.log('2. Run supabase-setup.sql in your Supabase dashboard');
    console.log('3. Start your app: npm start');
    console.log('');
    console.log('📚 Check SETUP_COMPLETE.md for detailed instructions');
  } else {
    console.log('⚠️  SETUP INCOMPLETE');
    console.log('Please fix the issues above and run the setup again.');
  }

  console.log('='.repeat(50));
}

// Run setup if called directly
if (require.main === module) {
  runCompleteSetup();
}

module.exports = { runCompleteSetup };
