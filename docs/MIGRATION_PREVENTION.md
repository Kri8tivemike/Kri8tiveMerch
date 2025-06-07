# Migration Issue Prevention Guide

This document outlines the comprehensive strategy implemented to prevent migration-related issues from recurring in the application.

## 🛡️ Prevention Systems

### 1. **Migration Validator** (`src/utils/migration-validator.ts`)

A runtime validation system that:
- ✅ Validates role-based collections exist and are accessible
- ✅ Checks for deprecated environment variables
- ✅ Validates status values against approved standards
- ✅ Provides safe helper functions for user profile operations

**Usage:**
```javascript
// In browser console
validateMigration()        // Run full validation
validateCollections()      // Check collections only
validateEnvVars()         // Check environment variables
findUserProfileSafely(userId)  // Safe profile lookup
updateUserProfileSafely(userId, data)  // Safe profile update
```

### 2. **Deprecated Code Scanner** (`scripts/scan-deprecated-code.js`)

An automated scanner that:
- 🔍 Scans entire codebase for deprecated patterns
- 📊 Generates detailed reports with severity levels
- 🔧 Creates automated fix scripts
- 📝 Provides specific suggestions for each issue

**Usage:**
```bash
npm run scan-deprecated    # Scan for deprecated patterns
npm run fix-deprecated     # Apply automated fixes
npm run check-codebase     # Full validation suite
```

### 3. **Pre-commit Hooks** (`.husky/pre-commit`)

Prevents commits containing:
- ❌ HIGH priority deprecated patterns
- ❌ Legacy collection references
- ❌ Import errors from missing exports

### 4. **Runtime Validation**

The application automatically:
- 🔍 Validates migration status on startup
- ⚠️ Warns about deprecated environment variables
- 🛡️ Provides safe fallbacks for legacy code

## 📋 Approved Patterns

### ✅ **Collections**
```javascript
// Use these role-based collections
CUSTOMERS_COLLECTION_ID = 'customers'
SHOP_MANAGERS_COLLECTION_ID = 'shop_managers'  
SUPER_ADMINS_COLLECTION_ID = 'super_admins'
```

### ✅ **Status Values**
```javascript
// Use these capitalized status values
'Pending'      // User account pending verification
'Verified'     // User account verified and active
'Deactivated'  // User account deactivated
```

### ✅ **Environment Variables**
```bash
# Required environment variables
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=67ea2c3b00309b589901
VITE_APPWRITE_DATABASE_ID=kri8tive_db
```

## 🚫 Deprecated Patterns

### ❌ **Legacy Collections**
```javascript
// DO NOT USE - These will cause import errors
USER_PROFILES_COLLECTION_ID
VITE_APPWRITE_PROFILES_COLLECTION_ID
'user_profiles'
```

### ❌ **Legacy Status Values**
```javascript
// DO NOT USE - These are inconsistent
'active', 'inactive', 'verified', 'unverified', 'pending'
```

### ❌ **Deprecated Environment Variables**
```bash
# REMOVE from .env files
VITE_APPWRITE_PROFILES_COLLECTION_ID=user_profiles
```

## 🔧 Safe Helper Functions

### Finding User Profiles
```javascript
import { findUserProfileSafely } from '../utils/migration-validator';

// Safe way to find user profile across all collections
const profile = await findUserProfileSafely(userId);
if (profile) {
  console.log(`Found in ${profile.collection}:`, profile.document);
}
```

### Updating User Profiles
```javascript
import { updateUserProfileSafely } from '../utils/migration-validator';

// Safe way to update user profile with validation
const success = await updateUserProfileSafely(userId, {
  status: 'Verified',  // Automatically validated
  updated_at: new Date().toISOString()
});
```

### Collection Access Pattern
```javascript
// Standard pattern for accessing role-based collections
import { 
  CUSTOMERS_COLLECTION_ID, 
  SHOP_MANAGERS_COLLECTION_ID, 
  SUPER_ADMINS_COLLECTION_ID 
} from '../lib/appwrite-config';

const collections = [
  SUPER_ADMINS_COLLECTION_ID,
  SHOP_MANAGERS_COLLECTION_ID, 
  CUSTOMERS_COLLECTION_ID
];

for (const collectionId of collections) {
  try {
    const document = await databases.getDocument(DATABASE_ID, collectionId, userId);
    if (document) {
      return { collection: collectionId, document };
    }
  } catch (error) {
    if (error.code !== 404) {
      console.warn(`Error checking ${collectionId}:`, error);
    }
  }
}
```

## 🚀 Development Workflow

### Before Making Changes
1. **Run validation**: `npm run check-codebase`
2. **Check for deprecated patterns**: `npm run scan-deprecated`
3. **Validate collections**: Open console → `validateCollections()`

### During Development
1. **Use safe helper functions** for user profile operations
2. **Follow approved patterns** for collections and status values
3. **Test with validation** before committing

### Before Committing
1. **Pre-commit hook** automatically scans for issues
2. **Fix any HIGH priority** deprecated patterns
3. **Review generated fix scripts** before applying

### After Migration Changes
1. **Update validation patterns** in `migration-validator.ts`
2. **Update scanner patterns** in `scan-deprecated-code.js`
3. **Test validation functions** in browser console
4. **Update documentation** with new patterns

## 🔍 Monitoring & Maintenance

### Regular Checks
```bash
# Weekly codebase health check
npm run check-codebase

# Before major releases
npm run scan-deprecated
npm run validate-migration
```

### Console Diagnostics
```javascript
// Available in browser console
validateMigration()        // Full migration validation
validateCollections()      // Check collections exist
validateEnvVars()         // Check environment setup
runNetworkDiagnostics()   // Network connectivity tests
```

### Troubleshooting
1. **Import errors**: Run `npm run scan-deprecated` to find legacy references
2. **Collection not found**: Run `validateCollections()` to verify setup
3. **Status inconsistencies**: Check for lowercase status values
4. **Environment issues**: Run `validateEnvVars()` for configuration problems

## 📚 Additional Resources

- **Migration Summary**: `APPWRITE_MIGRATION_COMPLETE.md`
- **Database Schema**: `src/schema/README.md`
- **Network Diagnostics**: `src/utils/network-test.ts`
- **Debug Tools**: `src/utils/debugTools.ts`

## 🎯 Success Metrics

The prevention system is working when:
- ✅ No import errors from deprecated collections
- ✅ Consistent status values across the application
- ✅ Clean codebase scans with zero HIGH priority issues
- ✅ Successful pre-commit hooks
- ✅ Runtime validation passes without warnings 