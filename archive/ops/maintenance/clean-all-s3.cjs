const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.SharedIniFileCredentials({ profile: 'mvp' })
});

const s3 = new AWS.S3();
const BUCKET_NAME = 'color-code-research-results-984906149037';

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
      const result = await s3.listObjectsV2(params).promise();
      objects.push(...(result.Contents || []));
      continuationToken = result.NextContinuationToken;
    } catch (error) {
      console.error('Error listing objects:', error);
      break;
    }
  } while (continuationToken);
  
  return objects;
}

async function deleteObjects(objects) {
  if (objects.length === 0) return { deleted: 0, errors: 0 };
  
  // S3 deleteObjects can handle max 1000 objects at a time
  const chunks = [];
  for (let i = 0; i < objects.length; i += 1000) {
    chunks.push(objects.slice(i, i + 1000));
  }
  
  let totalDeleted = 0;
  let totalErrors = 0;
  
  for (const chunk of chunks) {
    const params = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: chunk.map(obj => ({ Key: obj.Key })),
        Quiet: false
      }
    };
    
    try {
      const result = await s3.deleteObjects(params).promise();
      totalDeleted += (result.Deleted || []).length;
      totalErrors += (result.Errors || []).length;
      
      if (result.Errors && result.Errors.length > 0) {
        console.error('Errors during deletion:', result.Errors);
      }
    } catch (error) {
      console.error('Error deleting objects:', error);
      totalErrors += chunk.length;
    }
  }
  
  return { deleted: totalDeleted, errors: totalErrors };
}

async function cleanAllS3Objects() {
  console.log('🗑️  Starting complete S3 bucket cleanup...\n');
  console.log(`Bucket: ${BUCKET_NAME}\n`);
  
  // List all objects
  console.log('📋 Fetching all objects from S3...');
  const objects = await listAllObjects();
  console.log(`Found ${objects.length} total objects\n`);
  
  if (objects.length === 0) {
    console.log('✅ No objects to delete. Bucket is already empty.');
    return;
  }
  
  // Group objects by prefix for better visibility
  const prefixGroups = {};
  objects.forEach(obj => {
    const prefix = obj.Key.split('/')[0];
    prefixGroups[prefix] = (prefixGroups[prefix] || 0) + 1;
  });
  
  console.log('Objects by prefix:');
  Object.entries(prefixGroups).forEach(([prefix, count]) => {
    console.log(`  - ${prefix}: ${count} objects`);
  });
  
  // Calculate total size
  const totalSize = objects.reduce((sum, obj) => sum + obj.Size, 0);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`\nTotal size: ${sizeMB} MB`);
  
  console.log('\n⚠️  WARNING: This will delete ALL objects from the S3 bucket!');
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');
  
  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Delete all objects
  console.log('🔥 Deleting all objects...\n');
  
  const startTime = Date.now();
  const { deleted, errors } = await deleteObjects(objects);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`  - Total objects found: ${objects.length}`);
  console.log(`  - Successfully deleted: ${deleted}`);
  console.log(`  - Failed to delete: ${errors}`);
  console.log(`  - Time taken: ${duration} seconds`);
  
  // Verify cleanup
  console.log('\n🔍 Verifying cleanup...');
  const remainingObjects = await listAllObjects();
  console.log(`Remaining objects in bucket: ${remainingObjects.length}`);
  
  if (remainingObjects.length === 0) {
    console.log('\n✅ S3 cleanup complete! All objects have been deleted.');
  } else {
    console.log('\n⚠️  Some objects could not be deleted. Please check the errors above.');
    console.log('Remaining objects:');
    remainingObjects.slice(0, 10).forEach(obj => {
      console.log(`  - ${obj.Key}`);
    });
    if (remainingObjects.length > 10) {
      console.log(`  ... and ${remainingObjects.length - 10} more`);
    }
  }
}

// Run the cleanup
cleanAllS3Objects().catch(console.error);