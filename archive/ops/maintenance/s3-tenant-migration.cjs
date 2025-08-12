#!/usr/bin/env node

/**
 * S3 Multi-Tenant Migration Utility
 * 
 * This script helps migrate existing S3 objects to the new multi-tenant structure
 * Usage: node s3-tenant-migration.cjs [--dry-run] [--tenant-id=xxx] [--project-id=xxx]
 */

const AWS = require('aws-sdk');
const { argv } = require('process');

// Configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'color-code-research-results-984906149037';
const DEFAULT_USER_ID = 'fprior';
const DEFAULT_PROJECT_ID = 'legacy-imports';
const PROFILE = 'mvp';

// Parse command line arguments
const args = argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const DRY_RUN = args['dry-run'] || false;
const USER_ID = args['user-id'] || DEFAULT_USER_ID;
const PROJECT_ID = args['project-id'] || DEFAULT_PROJECT_ID;
const SCOPE = args['scope'] || 'personal';  // personal, project, or team

// Configure AWS
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: PROFILE });
AWS.config.region = 'us-east-1';

const s3 = new AWS.S3();

// Statistics
const stats = {
  scanned: 0,
  migrated: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * Calculate new S3 key based on old key pattern
 */
function calculateNewKey(oldKey) {
  const now = new Date();
  
  // Pattern: research/{timestamp}_{id}.json
  if (oldKey.startsWith('research/')) {
    const filename = oldKey.substring(9); // Remove 'research/'
    const parts = filename.split('_');
    
    if (parts.length >= 2) {
      const timestamp = parts[0];
      const year = timestamp.substring(0, 4);
      const month = timestamp.substring(4, 6);
      const day = timestamp.substring(6, 8);
      
      const requestId = parts[1].replace('.json', '');
      
      // Determine path based on scope
      let newKey;
      if (SCOPE === 'project' && PROJECT_ID) {
        newKey = `users/${USER_ID}/projects/${PROJECT_ID}/research/${year}/${month}/${day}/${requestId}/response.json`;
      } else {
        // Default to personal workspace
        newKey = `users/${USER_ID}/personal/research/${year}/${month}/${day}/${requestId}/response.json`;
      }
      
      return {
        oldKey,
        newKey,
        type: 'research',
        userId: USER_ID,
        scope: SCOPE
      };
    }
  }
  
  // Pattern: reports/{team}_{timestamp}_{id}.json
  else if (oldKey.startsWith('reports/') && oldKey.includes('_')) {
    const filename = oldKey.substring(8); // Remove 'reports/'
    
    // Check if it's already in new format (has subdirectories)
    if (filename.includes('/')) {
      const parts = filename.split('/');
      const reportId = parts[0];
      const fileName = parts.slice(1).join('/');
      
      // Use report creation date if we can parse it from ID
      let year = now.getFullYear();
      let month = String(now.getMonth() + 1).padStart(2, '0');
      let day = String(now.getDate()).padStart(2, '0');
      
      let newKey;
      if (SCOPE === 'project' && PROJECT_ID) {
        newKey = `users/${USER_ID}/projects/${PROJECT_ID}/reports/${year}/${month}/${day}/${reportId}/${fileName}`;
      } else {
        newKey = `users/${USER_ID}/personal/reports/${year}/${month}/${day}/${reportId}/${fileName}`;
      }
      
      return {
        oldKey,
        newKey,
        type: 'report-v2',
        userId: USER_ID,
        scope: SCOPE
      };
    } else {
      // Old format: team_timestamp_id.json
      const parts = filename.split('_');
      
      if (parts.length >= 3) {
        const team = parts[0];
        const timestamp = parts[1];
        
        // Parse timestamp (could be different formats)
        let year, month, day;
        
        if (timestamp.length === 8) {
          // Format: 20240115
          year = timestamp.substring(0, 4);
          month = timestamp.substring(4, 6);
          day = timestamp.substring(6, 8);
        } else if (timestamp.includes('T')) {
          // Format: 20240115T103045
          year = timestamp.substring(0, 4);
          month = timestamp.substring(4, 6);
          day = timestamp.substring(6, 8);
        } else {
          // Fallback to current date
          year = now.getFullYear();
          month = String(now.getMonth() + 1).padStart(2, '0');
          day = String(now.getDate()).padStart(2, '0');
        }
        
        const reportId = parts.slice(2).join('_').replace('.json', '');
        
        // For team-based reports, we can either put them in team space or user space
        let newKey;
        if (team && SCOPE === 'team') {
          // Put in team space
          newKey = `teams/${team}/projects/${PROJECT_ID}/reports/${year}/${month}/${day}/${reportId}/processed.json`;
        } else {
          // Put in user's personal space with team notation
          newKey = `users/${USER_ID}/personal/reports/${year}/${month}/${day}/${team}_${reportId}/processed.json`;
        }
        
        return {
          oldKey,
          newKey,
          type: 'report',
          team,
          userId: USER_ID,
          scope: SCOPE
        };
      }
    }
  }
  
  return null;
}

/**
 * List all objects in the bucket
 */
async function listAllObjects() {
  const objects = [];
  let continuationToken = null;
  
  do {
    const params = {
      Bucket: BUCKET_NAME,
      MaxKeys: 1000
    };
    
    if (continuationToken) {
      params.ContinuationToken = continuationToken;
    }
    
    try {
      const response = await s3.listObjectsV2(params).promise();
      
      if (response.Contents) {
        objects.push(...response.Contents);
      }
      
      continuationToken = response.NextContinuationToken;
    } catch (error) {
      console.error('Error listing objects:', error);
      break;
    }
  } while (continuationToken);
  
  return objects;
}

/**
 * Migrate a single object
 */
async function migrateObject(mapping) {
  const { oldKey, newKey, type, team } = mapping;
  
  try {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would migrate:`);
      console.log(`  From: ${oldKey}`);
      console.log(`  To:   ${newKey}`);
      console.log(`  Type: ${type}${team ? ` (team: ${team})` : ''}`);
      stats.migrated++;
      return true;
    }
    
    // Copy object to new location
    await s3.copyObject({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${oldKey}`,
      Key: newKey,
      MetadataDirective: 'COPY',
      TaggingDirective: 'REPLACE',
      Tagging: `UserId=${USER_ID}&ProjectId=${PROJECT_ID}&ContentType=${type}&Scope=${SCOPE}&Migrated=true`
    }).promise();
    
    // Tag old object for later deletion
    await s3.putObjectTagging({
      Bucket: BUCKET_NAME,
      Key: oldKey,
      Tagging: {
        TagSet: [
          { Key: 'Migration', Value: 'completed' },
          { Key: 'MigratedTo', Value: newKey },
          { Key: 'MigrationDate', Value: new Date().toISOString() },
          { Key: 'DeleteAfter', Value: '30days' }
        ]
      }
    }).promise();
    
    console.log(`✓ Migrated: ${oldKey} → ${newKey}`);
    stats.migrated++;
    return true;
    
  } catch (error) {
    console.error(`✗ Failed to migrate ${oldKey}:`, error.message);
    stats.failed++;
    stats.errors.push({ key: oldKey, error: error.message });
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('S3 User-Based Migration Utility');
  console.log('=================================');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`User ID: ${USER_ID}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Scope: ${SCOPE}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  console.log('');
  
  // List all objects
  console.log('Scanning bucket...');
  const objects = await listAllObjects();
  console.log(`Found ${objects.length} objects`);
  console.log('');
  
  // Process each object
  const mappings = [];
  
  for (const obj of objects) {
    stats.scanned++;
    
    // Skip if already in new format
    if (obj.Key.startsWith('users/') || obj.Key.startsWith('teams/') || obj.Key.startsWith('organizations/')) {
      stats.skipped++;
      continue;
    }
    
    // Calculate new key
    const mapping = calculateNewKey(obj.Key);
    
    if (mapping) {
      mappings.push(mapping);
    } else {
      console.log(`⚠ Skipping unknown format: ${obj.Key}`);
      stats.skipped++;
    }
  }
  
  console.log(`\nFound ${mappings.length} objects to migrate`);
  console.log('');
  
  // Group by type for summary
  const typeCount = mappings.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Objects by type:');
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('');
  
  // Migrate objects
  if (mappings.length > 0) {
    console.log('Starting migration...\n');
    
    for (const mapping of mappings) {
      await migrateObject(mapping);
    }
  }
  
  // Print summary
  console.log('\n=================================');
  console.log('Migration Summary:');
  console.log(`  Total scanned: ${stats.scanned}`);
  console.log(`  Migrated: ${stats.migrated}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Skipped: ${stats.skipped}`);
  
  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(({ key, error }) => {
      console.log(`  ${key}: ${error}`);
    });
  }
  
  if (DRY_RUN) {
    console.log('\n⚠ This was a DRY RUN. No changes were made.');
    console.log('Run without --dry-run to perform actual migration.');
  }
}

// Run the migration
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});