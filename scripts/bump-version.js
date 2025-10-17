#!/usr/bin/env node

/**
 * Automated Version Bump Script for MySked
 * 
 * Usage:
 *   yarn bump:patch  # Bug fixes: 1.0.0 → 1.0.1
 *   yarn bump:minor  # New features: 1.0.0 → 1.1.0
 *   yarn bump:major  # Breaking changes: 1.0.0 → 2.0.0
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version type from command line argument
const versionType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ Invalid version type. Use: patch, minor, or major');
  process.exit(1);
}

console.log(`\n🚀 Bumping ${versionType} version...\n`);

try {
  // 1. Run yarn version to update package.json
  console.log('📦 Step 1: Updating package.json...');
  execSync(`yarn version --${versionType} --no-git-tag-version`, { stdio: 'inherit' });

  // 2. Read the new version from package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const newVersion = packageJson.version;

  console.log(`\n✅ New version: ${newVersion}\n`);

  // 3. Update service-worker.js
  console.log('🔧 Step 2: Updating service-worker.js...');
  const serviceWorkerPath = path.join(__dirname, '..', 'public', 'service-worker.js');
  let serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
  serviceWorkerContent = serviceWorkerContent.replace(
    /const APP_VERSION = '[^']+';/,
    `const APP_VERSION = '${newVersion}';`
  );
  fs.writeFileSync(serviceWorkerPath, serviceWorkerContent, 'utf8');
  console.log('✅ service-worker.js updated');

  // 4. Update manifest.json
  console.log('🔧 Step 3: Updating manifest.json...');
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = newVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('✅ manifest.json updated');

  // 5. Git commit and tag
  console.log('\n📝 Step 4: Creating Git commit and tag...');
  execSync('git add package.json public/service-worker.js public/manifest.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
  execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { stdio: 'inherit' });

  console.log(`\n✨ Successfully bumped version to ${newVersion}!\n`);
  console.log('📋 Summary:');
  console.log(`   • package.json → ${newVersion}`);
  console.log(`   • service-worker.js → ${newVersion}`);
  console.log(`   • manifest.json → ${newVersion}`);
  console.log(`   • Git tag created: v${newVersion}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   • Review changes: git show v${newVersion}`);
  console.log(`   • Push changes: git push && git push --tags`);
  console.log(`   • Deploy to production\n`);

} catch (error) {
  console.error('\n❌ Error during version bump:', error.message);
  process.exit(1);
}

