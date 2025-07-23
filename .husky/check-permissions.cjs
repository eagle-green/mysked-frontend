#!/usr/bin/env node

/**
 * Pre-commit hook to check if junior engineers are modifying allowed files only
 * FRONTEND REPOSITORY ONLY - No backend restrictions needed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define allowed paths for junior engineers (FRONTEND ONLY)
const ALLOWED_PATHS_JUNIOR = [
  'src/sections/timecard/',
  'src/components/timecard/',
  'src/types/timecard.ts',
  'src/hooks/use-timecard.ts',
  'src/utils/timecard-helpers.ts',
  'src/utils/timecard/',
  // Allow docs and tests
  'docs/timecard/',
  'src/**/*.test.ts',
  'src/**/*.test.tsx',
  'README.md',
];

// Define restricted paths (FRONTEND SENSITIVE FILES)
const RESTRICTED_PATHS = [
  'src/lib/axios.ts',
  'src/auth/',
  'src/global-config.ts',
  '.env',
  '.env.local',
  '.env.production',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  '.husky/',
];

// Junior engineer usernames (update with actual GitHub usernames)
const JUNIOR_ENGINEERS = [
  'junior-engineer-1',
  'junior-engineer-2',
  // Add more as needed
];

function getCurrentUser() {
  try {
    return execSync('git config user.name', { encoding: 'utf8' }).trim();
  } catch (error) {
    return process.env.GIT_AUTHOR_NAME || 'unknown';
  }
}

function getChangedFiles() {
  try {
    // Get files changed in current commit
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    console.log('Warning: Could not get changed files');
    return [];
  }
}

function isPathAllowed(filePath, allowedPaths) {
  return allowedPaths.some(allowed => {
    if (allowed.includes('**')) {
      // Handle glob patterns
      const pattern = allowed.replace(/\*\*/g, '.*');
      const regex = new RegExp(`^${pattern}`);
      return regex.test(filePath);
    }
    return filePath.startsWith(allowed) || filePath === allowed;
  });
}

function isPathRestricted(filePath, restrictedPaths) {
  return restrictedPaths.some(restricted => 
    filePath.startsWith(restricted) || filePath === restricted
  );
}

function checkPermissions() {
  const currentUser = getCurrentUser();
  const isJuniorEngineer = JUNIOR_ENGINEERS.includes(currentUser);
  
  if (!isJuniorEngineer) {
    console.log(`✅ Senior engineer (${currentUser}) - full frontend access granted`);
    return true;
  }

  console.log(`🔍 Checking frontend permissions for junior engineer: ${currentUser}`);
  
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('ℹ️  No files to check');
    return true;
  }

  const violations = [];
  
  changedFiles.forEach(file => {
    if (isPathRestricted(file, RESTRICTED_PATHS)) {
      violations.push(`❌ RESTRICTED: ${file}`);
    } else if (!isPathAllowed(file, ALLOWED_PATHS_JUNIOR)) {
      violations.push(`⚠️  NOT ALLOWED: ${file}`);
    } else {
      console.log(`✅ ALLOWED: ${file}`);
    }
  });

  if (violations.length > 0) {
    console.log('\n🚫 Permission violations detected:');
    violations.forEach(violation => console.log(violation));
    console.log('\n📋 Allowed paths for junior engineers:');
    ALLOWED_PATHS_JUNIOR.forEach(path => console.log(`  - ${path}`));
    console.log('\n💡 Please only modify files in your assigned timecard directories.');
    console.log('   Contact the senior engineer if you need access to other files.');
    return false;
  }

  console.log('✅ All file changes are within allowed paths');
  return true;
}

// Run the check
if (!checkPermissions()) {
  process.exit(1);
}
