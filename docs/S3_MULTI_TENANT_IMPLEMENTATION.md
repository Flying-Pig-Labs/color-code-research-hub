# S3 Multi-Tenant Implementation Guide

## Overview

This guide provides concrete implementation steps to transition from the current flat S3 structure to the proposed multi-tenant architecture.

## Lambda Function Updates

### 1. Update researchApi.py

```python
# Current Implementation (BEFORE)
def upload_to_s3(content: str, metadata: Dict[str, Any]) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    research_id = str(uuid.uuid4())[:8]
    s3_key = f"research/{timestamp}_{research_id}.json"
    
# New Implementation (AFTER)
def upload_to_s3(content: str, metadata: Dict[str, Any], context: Dict[str, str]) -> str:
    """Upload research results to S3 with user-centric structure."""
    # Extract user context
    user_id = context.get('user_id', 'anonymous')
    project_id = context.get('project_id')
    scope = context.get('scope', 'personal')  # personal, project, or team
    team_id = context.get('team_id')
    
    # Generate time-based path
    now = datetime.now(timezone.utc)
    year = now.strftime("%Y")
    month = now.strftime("%m")
    day = now.strftime("%d")
    
    # Generate unique identifiers
    timestamp = now.strftime("%Y%m%dT%H%M%SZ")
    request_id = str(uuid.uuid4())
    
    # Build S3 path based on scope
    if scope == 'personal' or not project_id:
        # Personal workspace
        s3_key = f"users/{user_id}/personal/research/{year}/{month}/{day}/{request_id}/response.json"
    elif scope == 'project':
        # User project
        s3_key = f"users/{user_id}/projects/{project_id}/research/{year}/{month}/{day}/{request_id}/response.json"
    elif scope == 'team' and team_id:
        # Team project
        s3_key = f"teams/{team_id}/projects/{project_id}/research/{year}/{month}/{day}/{request_id}/response.json"
    else:
        # Fallback to personal
        s3_key = f"users/{user_id}/personal/research/{year}/{month}/{day}/{request_id}/response.json"
    
    # Enhanced metadata
    s3_data = {
        "version": "2.0",
        "requestId": request_id,
        "userId": user_id,
        "projectId": project_id,
        "teamId": team_id,
        "scope": scope,
        "metadata": {
            **metadata,
            "timestamp": timestamp,
            "created": now.isoformat(),
            "createdBy": user_id
        },
        "content": content,
        "processing": {
            "handler": "researchApi",
            "version": "2.0.0"
        }
    }
    
    # Upload with tags
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=json.dumps(s3_data, indent=2),
        ContentType="application/json",
        Metadata={
            "user-id": user_id,
            "project-id": project_id or "",
            "team-id": team_id or "",
            "request-id": request_id,
            "scope": scope
        },
        Tagging=f"UserId={user_id}&Scope={scope}&ContentType=research"
    )
```

### 2. Update reportProcessor.js

```javascript
// Current Implementation (BEFORE)
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
const s3Key = `reports/${team}_${timestamp}_${requestId}.json`;

// New Implementation (AFTER)
function generateS3Key(context, reportId) {
  const { tenantId, projectId, teamId } = context;
  const now = new Date();
  
  // Generate date-based path
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  
  // Build S3 path
  return `tenants/${tenantId}/projects/${projectId}/reports/${year}/${month}/${day}/${reportId}/`;
}

async function uploadReport(reportData, context) {
  const reportId = `rpt_${uuidv4().substring(0, 8)}`;
  const basePath = generateS3Key(context, reportId);
  
  // Enhanced report data with tenant context
  const enhancedData = {
    version: "2.0",
    reportId,
    tenantId: context.tenantId,
    projectId: context.projectId,
    teamId: context.teamId,
    ...reportData,
    lifecycle: {
      created: new Date().toISOString(),
      retention: context.retentionDays || 365,
      classification: context.classification || "internal"
    }
  };
  
  // Upload main report
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: `${basePath}processed.json`,
    Body: JSON.stringify(enhancedData, null, 2),
    ContentType: 'application/json',
    Metadata: {
      'tenant-id': context.tenantId,
      'project-id': context.projectId,
      'report-id': reportId
    },
    Tagging: {
      TagSet: [
        { Key: 'TenantId', Value: context.tenantId },
        { Key: 'ProjectId', Value: context.projectId },
        { Key: 'ContentType', Value: 'report' }
      ]
    }
  }));
  
  return { basePath, reportId };
}
```

### 3. Update generateResearchReport.js

```javascript
// Current Implementation (BEFORE)
const baseKey = `reports/${requestId}`;

// New Implementation (AFTER)
function buildS3Structure(requestId, context) {
  const { tenantId, projectId } = context;
  const now = new Date();
  
  // Time-based organization
  const datePath = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0')
  ].join('/');
  
  return {
    basePath: `tenants/${tenantId}/projects/${projectId}/reports/${datePath}/${requestId}/`,
    metadata: {
      tenantId,
      projectId,
      created: now.toISOString(),
      requestId
    }
  };
}

async function uploadReportFormats(structuredReport, researchResponse, requestId, context) {
  const { basePath, metadata } = buildS3Structure(requestId, context);
  
  // Create all format uploads with proper paths
  const uploads = [
    {
      Key: `${basePath}raw.json`,
      Body: JSON.stringify(researchResponse, null, 2),
      ContentType: 'application/json'
    },
    {
      Key: `${basePath}report.json`,
      Body: JSON.stringify({ ...structuredReport, ...metadata }, null, 2),
      ContentType: 'application/json'
    },
    {
      Key: `${basePath}report.md`,
      Body: markdownContent,
      ContentType: 'text/markdown'
    },
    {
      Key: `${basePath}report.html`,
      Body: htmlContent,
      ContentType: 'text/html'
    },
    {
      Key: `${basePath}cleaned.md`,
      Body: cleanedContent,
      ContentType: 'text/markdown'
    }
  ];
  
  // Upload all formats with tenant tags
  await Promise.all(uploads.map(upload => 
    s3Client.send(new PutObjectCommand({
      Bucket: RESEARCH_BUCKET,
      ...upload,
      Metadata: {
        'tenant-id': context.tenantId,
        'project-id': context.projectId,
        'request-id': requestId
      },
      Tagging: {
        TagSet: [
          { Key: 'TenantId', Value: context.tenantId },
          { Key: 'ProjectId', Value: context.projectId }
        ]
      }
    }))
  ));
  
  return { basePath, formats: uploads.map(u => u.Key) };
}
```

## DynamoDB Schema Updates

### Current Schema
```
Table: ResearchReports
PrimaryKey: reportId
GSI: team-createdAt-index
```

### New Schema
```
Table: ResearchReportsV2
PrimaryKey: tenantId (HASH), reportId (RANGE)
GSI1: tenantId-createdAt-index
GSI2: projectId-createdAt-index
GSI3: tenantId-projectId-index
```

### Migration Function
```python
def migrate_dynamodb_item(old_item):
    """Migrate DynamoDB item to new schema with tenant support"""
    # Extract or default tenant/project
    tenant_id = old_item.get('tenantId', 'default-tenant')
    project_id = old_item.get('projectId', 'default-project')
    
    # Update S3 keys to new structure
    if 's3Key' in old_item:
        old_key = old_item['s3Key']
        # Parse old key and reconstruct
        new_key = reconstruct_s3_key(old_key, tenant_id, project_id)
        old_item['s3Key'] = new_key
    
    # Add tenant fields
    new_item = {
        **old_item,
        'tenantId': tenant_id,
        'projectId': project_id,
        'version': '2.0',
        'migrated': True,
        'migratedAt': datetime.now().isoformat()
    }
    
    return new_item
```

## API Gateway Updates

### Add Tenant Context Middleware

```javascript
// middleware/tenantContext.js
exports.extractTenantContext = (event) => {
  // Option 1: From JWT token
  if (event.headers.Authorization) {
    const token = decodeJWT(event.headers.Authorization);
    return {
      tenantId: token.tenantId,
      projectId: token.projectId || 'default-project',
      userId: token.sub
    };
  }
  
  // Option 2: From API key
  if (event.headers['X-API-Key']) {
    const apiKeyData = lookupApiKey(event.headers['X-API-Key']);
    return {
      tenantId: apiKeyData.tenantId,
      projectId: apiKeyData.projectId || 'default-project'
    };
  }
  
  // Option 3: From path parameters
  if (event.pathParameters?.tenantId) {
    return {
      tenantId: event.pathParameters.tenantId,
      projectId: event.pathParameters.projectId || 'default-project'
    };
  }
  
  // Default tenant for migration period
  return {
    tenantId: 'default-tenant',
    projectId: 'default-project'
  };
};
```

### Update API Routes

```yaml
# Current routes
/api/research/reports
/api/plan/generate-cli-plan

# New tenant-aware routes (backward compatible)
/api/research/reports
/api/tenants/{tenantId}/research/reports
/api/tenants/{tenantId}/projects/{projectId}/research/reports

/api/plan/generate-cli-plan
/api/tenants/{tenantId}/plan/generate-cli-plan
/api/tenants/{tenantId}/projects/{projectId}/plan/generate-cli-plan
```

## Migration Script

```python
import boto3
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import logging

class S3MultiTenantMigrator:
    def __init__(self, bucket_name, dry_run=True):
        self.s3 = boto3.client('s3')
        self.bucket = bucket_name
        self.dry_run = dry_run
        self.stats = {
            'scanned': 0,
            'migrated': 0,
            'failed': 0,
            'skipped': 0
        }
    
    def migrate_bucket(self):
        """Main migration entry point"""
        logging.info(f"Starting migration for bucket: {self.bucket}")
        
        # List all objects
        paginator = self.s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=self.bucket)
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            for page in pages:
                if 'Contents' not in page:
                    continue
                
                for obj in page['Contents']:
                    executor.submit(self.migrate_object, obj['Key'])
        
        logging.info(f"Migration complete: {self.stats}")
    
    def migrate_object(self, old_key):
        """Migrate single object to new structure"""
        self.stats['scanned'] += 1
        
        try:
            # Determine new key
            new_key = self.calculate_new_key(old_key)
            
            if not new_key:
                self.stats['skipped'] += 1
                return
            
            if self.dry_run:
                logging.info(f"DRY RUN: Would migrate {old_key} -> {new_key}")
            else:
                # Copy to new location
                self.s3.copy_object(
                    Bucket=self.bucket,
                    CopySource={'Bucket': self.bucket, 'Key': old_key},
                    Key=new_key,
                    MetadataDirective='COPY',
                    TaggingDirective='COPY'
                )
                
                # Tag old object for deletion
                self.s3.put_object_tagging(
                    Bucket=self.bucket,
                    Key=old_key,
                    Tagging={
                        'TagSet': [
                            {'Key': 'Migration', 'Value': 'completed'},
                            {'Key': 'DeleteAfter', 'Value': '30days'}
                        ]
                    }
                )
                
                logging.info(f"Migrated: {old_key} -> {new_key}")
            
            self.stats['migrated'] += 1
            
        except Exception as e:
            logging.error(f"Failed to migrate {old_key}: {str(e)}")
            self.stats['failed'] += 1
    
    def calculate_new_key(self, old_key):
        """Calculate new key based on old key pattern"""
        # Pattern: research/{timestamp}_{id}.json
        if old_key.startswith('research/'):
            parts = old_key[9:].split('_')
            if len(parts) >= 2:
                timestamp = parts[0]
                # Parse timestamp: 20240115_103045
                year = timestamp[0:4]
                month = timestamp[4:6]
                day = timestamp[6:8]
                
                request_id = parts[1].replace('.json', '')
                
                return f"tenants/default-tenant/projects/legacy/research/{year}/{month}/{day}/{request_id}/response.json"
        
        # Pattern: reports/{team}_{timestamp}_{id}.json
        elif old_key.startswith('reports/'):
            # Special handling for new research report format
            if '/' in old_key[8:]:  # reports/{id}/file.ext
                report_id = old_key.split('/')[1]
                file_name = '/'.join(old_key.split('/')[2:])
                
                # Use current date for organization
                now = datetime.now()
                year = now.strftime("%Y")
                month = now.strftime("%m")
                day = now.strftime("%d")
                
                return f"tenants/default-tenant/projects/legacy/reports/{year}/{month}/{day}/{report_id}/{file_name}"
            else:
                # Old format: reports/{team}_{timestamp}_{id}.json
                parts = old_key[8:].split('_')
                if len(parts) >= 3:
                    team = parts[0]
                    timestamp = parts[1]
                    
                    # Parse timestamp
                    year = timestamp[0:4]
                    month = timestamp[4:6] 
                    day = timestamp[6:8]
                    
                    report_id = '_'.join(parts[2:]).replace('.json', '')
                    
                    return f"tenants/default-tenant/teams/{team}/reports/{year}/{month}/{day}/{report_id}/processed.json"
        
        return None

# Usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Dry run first
    migrator = S3MultiTenantMigrator('color-code-research-results-984906149037', dry_run=True)
    migrator.migrate_bucket()
    
    # Actual migration
    # migrator = S3MultiTenantMigrator('color-code-research-results-984906149037', dry_run=False)
    # migrator.migrate_bucket()
```

## Rollback Strategy

### 1. Dual-Write Period
During migration, write to both old and new locations:

```javascript
async function dualWriteToS3(data, oldKey, newKey) {
  // Write to new location
  await s3.putObject({
    Bucket: BUCKET,
    Key: newKey,
    Body: data
  });
  
  // Also write to old location for compatibility
  await s3.putObject({
    Bucket: BUCKET,
    Key: oldKey,
    Body: data
  });
}
```

### 2. Read with Fallback
```javascript
async function readWithFallback(newKey, oldKey) {
  try {
    // Try new location first
    return await s3.getObject({
      Bucket: BUCKET,
      Key: newKey
    });
  } catch (error) {
    if (error.Code === 'NoSuchKey') {
      // Fallback to old location
      return await s3.getObject({
        Bucket: BUCKET,
        Key: oldKey
      });
    }
    throw error;
  }
}
```

## Testing Strategy

### 1. Unit Tests
```javascript
describe('Multi-tenant S3 paths', () => {
  test('generates correct research path', () => {
    const context = {
      tenantId: 'test-tenant',
      projectId: 'test-project'
    };
    
    const path = generateResearchPath(context, 'req123');
    expect(path).toMatch(/^tenants\/test-tenant\/projects\/test-project\/research\/\d{4}\/\d{2}\/\d{2}\/req123\/$/);
  });
});
```

### 2. Integration Tests
```python
def test_tenant_isolation():
    """Ensure tenants cannot access each other's data"""
    # Create data for tenant A
    s3.put_object(
        Bucket=BUCKET,
        Key='tenants/tenant-a/projects/proj1/data.json',
        Body=json.dumps({'data': 'tenant-a'})
    )
    
    # Try to access with tenant B credentials
    with pytest.raises(AccessDenied):
        s3_tenant_b.get_object(
            Bucket=BUCKET,
            Key='tenants/tenant-a/projects/proj1/data.json'
        )
```

## Monitoring

### CloudWatch Metrics
```python
def publish_migration_metrics(stats):
    cloudwatch = boto3.client('cloudwatch')
    
    cloudwatch.put_metric_data(
        Namespace='S3Migration',
        MetricData=[
            {
                'MetricName': 'ObjectsMigrated',
                'Value': stats['migrated'],
                'Unit': 'Count'
            },
            {
                'MetricName': 'MigrationErrors',
                'Value': stats['failed'],
                'Unit': 'Count'
            }
        ]
    )
```

## Timeline

### Week 1-2: Preparation
- Review and approve design
- Update Lambda functions for dual-write
- Deploy tenant context middleware
- Create migration scripts

### Week 3-4: Testing
- Test in development environment
- Run migration dry-run
- Validate data integrity
- Performance testing

### Week 5-6: Migration
- Enable dual-write in production
- Run migration in batches
- Monitor for errors
- Validate migrated data

### Week 7-8: Cleanup
- Switch to new paths only
- Remove dual-write code
- Delete old objects
- Update documentation

## Success Criteria

1. **Zero Data Loss**: All files successfully migrated
2. **No Downtime**: System remains operational throughout
3. **Performance**: No degradation in response times
4. **Cost Neutral**: Migration doesn't significantly increase costs
5. **Tenant Isolation**: Verified through security testing