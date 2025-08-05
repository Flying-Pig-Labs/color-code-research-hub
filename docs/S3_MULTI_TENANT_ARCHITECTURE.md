# S3 Multi-Tenant Architecture Design

## Executive Summary

This document proposes a complete reorganization of the S3 bucket structure to support multi-tenancy, better governance, and scalability for the Color Code Research Hub.

## Proposed S3 Structure

```
color-code-research-hub-{environment}/
├── users/
│   ├── {user_id}/                          # e.g., fprior, jsmith, etc.
│   │   ├── profile.json                    # User profile and settings
│   │   ├── personal/                       # Personal workspace
│   │   │   ├── research/
│   │   │   │   └── {year}/{month}/{day}/
│   │   │   │       └── {request_id}/
│   │   │   │           ├── request.json
│   │   │   │           ├── response.json
│   │   │   │           └── summary.json
│   │   │   ├── reports/
│   │   │   │   └── {year}/{month}/{day}/
│   │   │   │       └── {report_id}/
│   │   │   │           ├── raw.json
│   │   │   │           ├── processed.json
│   │   │   │           ├── report.md
│   │   │   │           └── report.html
│   │   │   └── scratch/                    # Temporary workspace
│   │   │       └── {session_id}/
│   │   └── projects/
│   │       └── {project_id}/
│   │           ├── metadata.json           # Project metadata
│   │           ├── collaborators.json      # Who has access
│   │           ├── research/
│   │           │   └── {year}/{month}/{day}/
│   │           │       └── {request_id}/
│   │           │           ├── request.json
│   │           │           ├── response.json
│   │           │           └── summary.json
│   │           ├── reports/
│   │           │   └── {year}/{month}/{day}/
│   │           │       └── {report_id}/
│   │           │           ├── raw.json
│   │           │           ├── processed.json
│   │           │           ├── report.md
│   │           │           ├── report.html
│   │           │           └── artifacts/
│   │           │               └── {artifact_name}
│   │           ├── plans/
│   │           │   └── {year}/{month}/
│   │           │       └── {plan_id}/
│   │           │           ├── phases.json
│   │           │           ├── epics.json
│   │           │           └── issues.json
│   │           └── analytics/
│   │               └── {year}/{month}/
│   │                   └── usage-stats.json
├── teams/
│   ├── {team_id}/                          # Shared team spaces
│   │   ├── metadata.json                   # Team info
│   │   ├── members.json                    # Team members (user_ids)
│   │   └── projects/                       # Team projects
│   │       └── {project_id}/               # Same structure as user projects
│   │           └── ...
├── organizations/                           # For enterprise customers
│   ├── {org_id}/
│   │   ├── metadata.json
│   │   ├── users/                          # Org users
│   │   ├── teams/                          # Org teams
│   │   ├── projects/                       # Org-wide projects
│   │   └── billing/
│   │       └── {year}/{month}/
│   │           ├── usage.json
│   │           └── invoice.pdf
├── shared/
│   ├── templates/
│   │   ├── research/
│   │   ├── reports/
│   │   └── plans/
│   └── models/
│       └── fine-tuned/
└── system/
    ├── audit/
    │   └── {year}/{month}/{day}/
    │       └── audit-{timestamp}.json
    └── analytics/
        ├── users/
        │   └── {year}/{month}/
        └── global/
            └── {year}/{month}/
```

## Key Design Principles

### 1. User-Centric Organization
- **Primary Scope**: `/users/{user_id}/` for personal workspaces
- **User ID Format**: Lowercase alphanumeric (e.g., `fprior`, `jsmith`, `mary-jones`)
- **Personal vs Project**: Clear separation between personal research and project work
- **Profile Metadata**: Each user has a `profile.json` with:
  ```json
  {
    "userId": "fprior",
    "email": "fprior@oceanstudio.io",
    "name": "F Prior",
    "createdAt": "2024-01-15T10:30:00Z",
    "organization": "ocean-studio",
    "role": "admin",
    "preferences": {
      "defaultProject": "ocean-studio-mvp",
      "dataRetention": 90,
      "notifications": true
    },
    "quotas": {
      "monthlyReports": 100,
      "storageGB": 50,
      "apiCalls": 10000
    },
    "teams": ["red-team", "research-team"]
  }
  ```

### 2. Project Organization
- **User Projects**: `/users/{user_id}/projects/{project_id}/` for individual work
- **Team Projects**: `/teams/{team_id}/projects/{project_id}/` for collaboration
- **Project ID**: Use slugified names (e.g., `ocean-studio-mvp`, `ai-research-2024`)
- **Collaborators**: Each project tracks who has access via `collaborators.json`:
  ```json
  {
    "owner": "fprior",
    "collaborators": [
      {
        "userId": "jsmith",
        "role": "contributor",
        "permissions": ["read", "write"],
        "addedAt": "2024-01-20T10:00:00Z"
      }
    ],
    "public": false,
    "teamId": "red-team"
  }
  ```

### 3. Content Type Separation
- **Personal Workspace**: Quick personal research and drafts
- **Project Research**: Formal research tied to specific projects
- **Reports**: Processed reports with multiple formats
- **Plans**: Project planning artifacts (phases, epics, issues)
- **Analytics**: Usage statistics per user and project

### 4. Standardized Naming Conventions

#### File Naming Pattern
```
{content_type}_{timestamp}_{id}_{version}.{format}
```

Examples:
- `research_20240115T103045Z_550e8400_v1.json`
- `report_20240115T103045Z_abc123def_v2.html`
- `plan_20240115T103045Z_proj001_v1.json`

#### Timestamp Format
- **ISO 8601**: `YYYY-MM-DDTHH:MM:SSZ`
- Always use UTC timezone

#### ID Formats
- **Tenant ID**: UUID v4
- **Project ID**: Lowercase alphanumeric with hyphens
- **Request/Report ID**: UUID v4 or alphanumeric (8-12 chars)
- **Team ID**: Lowercase alphanumeric (e.g., `red-team`, `black-team`)

## Implementation Strategy

### Phase 1: New Structure for New Data
1. Update Lambda functions to use new paths
2. Implement tenant context middleware
3. Add project selection to UI

### Phase 2: Migration Tool
Create a migration Lambda to:
1. Scan existing files
2. Infer tenant/project from metadata
3. Copy to new structure
4. Verify integrity
5. Update DynamoDB references

### Phase 3: Access Control
Implement IAM policies with tenant isolation:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::color-code-research-hub-prod/tenants/${aws:userid}/*"
    }
  ]
}
```

## S3 Lifecycle Rules

### 1. Hot Storage (0-30 days)
- Standard storage class
- Immediate access for active projects

### 2. Warm Storage (31-90 days)
- Transition to S3 Standard-IA
- Reduced cost for less frequent access

### 3. Cold Storage (91-365 days)
- Transition to S3 Glacier Instant Retrieval
- Long-term retention at low cost

### 4. Archive (365+ days)
- Move to S3 Glacier Deep Archive
- Or delete based on tenant settings

### Example Lifecycle Configuration
```xml
<LifecycleConfiguration>
  <Rule>
    <ID>TenantDataLifecycle</ID>
    <Status>Enabled</Status>
    <Prefix>tenants/</Prefix>
    <Transition>
      <Days>30</Days>
      <StorageClass>STANDARD_IA</StorageClass>
    </Transition>
    <Transition>
      <Days>90</Days>
      <StorageClass>GLACIER_IR</StorageClass>
    </Transition>
    <Transition>
      <Days>365</Days>
      <StorageClass>DEEP_ARCHIVE</StorageClass>
    </Transition>
  </Rule>
</LifecycleConfiguration>
```

## Metadata Standards

### Report Metadata Structure
```json
{
  "version": "2.0",
  "reportId": "rpt_550e8400",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "ocean-studio-mvp",
  "teamId": "red-team",
  "metadata": {
    "title": "AI Market Research Report",
    "description": "Comprehensive analysis of AI market trends",
    "requester": {
      "userId": "usr_123456",
      "name": "John Doe",
      "email": "john@acme.com"
    },
    "created": "2024-01-15T10:30:00Z",
    "modified": "2024-01-15T11:45:00Z",
    "tags": ["ai", "market-research", "2024"],
    "cost": {
      "tokens": 15000,
      "amount": 0.45,
      "currency": "USD"
    }
  },
  "processing": {
    "duration": 45.3,
    "model": "claude-3-5-sonnet-20241022",
    "apiCalls": 3
  },
  "formats": {
    "raw": "raw.json",
    "processed": "processed.json",
    "markdown": "report.md",
    "html": "report.html"
  },
  "lifecycle": {
    "retention": 365,
    "classification": "confidential",
    "lastAccessed": "2024-01-20T09:15:00Z"
  }
}
```

## Benefits of New Structure

### 1. **Multi-Tenancy**
- Complete isolation between customers
- Easy to implement access controls
- Simple billing and usage tracking

### 2. **Scalability**
- Handles millions of files efficiently
- Time-based partitioning prevents folder bloat
- Easy to parallelize operations

### 3. **Governance**
- Clear data ownership
- Audit trail support
- Compliance-ready structure

### 4. **Performance**
- Optimized for S3 prefix-based operations
- Efficient lifecycle rules
- Better caching strategies

### 5. **Cost Management**
- Per-tenant usage tracking
- Automated tiering
- Easy cleanup of old data

## Migration Path

### Step 1: Analyze Current Data
```python
def analyze_current_structure():
    """Scan existing S3 bucket and categorize files"""
    categorized = {
        'research': [],
        'reports': [],
        'unknown': []
    }
    
    for obj in s3.list_objects_v2(Bucket=BUCKET):
        key = obj['Key']
        if key.startswith('research/'):
            categorized['research'].append(key)
        elif key.startswith('reports/'):
            categorized['reports'].append(key)
        else:
            categorized['unknown'].append(key)
    
    return categorized
```

### Step 2: Create Tenant Mappings
```python
def create_tenant_mapping():
    """Map existing data to tenants based on metadata"""
    return {
        'default': {
            'tenantId': 'default-tenant-id',
            'projects': {
                'legacy': 'legacy-project'
            }
        },
        # Add specific mappings as identified
    }
```

### Step 3: Migrate Files
```python
def migrate_file(old_key, new_key):
    """Copy file to new location with metadata preservation"""
    # Copy object
    s3.copy_object(
        CopySource={'Bucket': BUCKET, 'Key': old_key},
        Bucket=BUCKET,
        Key=new_key,
        MetadataDirective='COPY'
    )
    
    # Update DynamoDB references
    update_dynamodb_references(old_key, new_key)
    
    # Mark old file for deletion
    tag_for_deletion(old_key)
```

## Monitoring and Alerts

### CloudWatch Metrics
- Storage usage per tenant
- API calls per project
- Lifecycle transitions
- Access patterns

### Alarms
- Unusual access patterns
- Storage quota exceeded
- Failed lifecycle transitions
- Cross-tenant access attempts

## Security Considerations

### 1. Encryption
- Enable S3 bucket encryption
- Use KMS for sensitive tenants
- Separate encryption keys per tenant for enterprise

### 2. Access Logging
- Enable S3 access logging
- Store logs in separate bucket
- Regular audit reviews

### 3. Bucket Policies
- Deny public access
- Enforce HTTPS
- Require MFA for deletions

### 4. Cross-Tenant Protection
- IAM policies with tenant conditions
- S3 bucket policies with prefix restrictions
- Regular permission audits

## Next Steps

1. **Approval**: Review and approve the proposed structure
2. **Pilot**: Implement for one test tenant
3. **Tools**: Build migration and management tools
4. **Documentation**: Update all system documentation
5. **Training**: Train team on new structure
6. **Migration**: Phased migration of existing data
7. **Monitoring**: Set up comprehensive monitoring

## Appendix: File Examples

### Research File
```
/tenants/550e8400-e29b-41d4-a716-446655440000/projects/ocean-studio-mvp/research/2024/01/15/req_abc123/
├── request.json    # Original research request
├── response.json   # Perplexity API response
└── summary.json    # Extracted summary and metadata
```

### Report File
```
/tenants/550e8400-e29b-41d4-a716-446655440000/projects/ocean-studio-mvp/reports/2024/01/15/rpt_def456/
├── raw.json        # Raw API response
├── processed.json  # Structured report data
├── report.md       # Markdown format
├── report.html     # HTML format
└── artifacts/      # Additional files (images, CSVs, etc.)
```

### Plan File
```
/tenants/550e8400-e29b-41d4-a716-446655440000/projects/ocean-studio-mvp/plans/2024/01/plan_ghi789/
├── phases.json     # Project phases
├── epics.json      # Epic definitions
└── issues.json     # GitHub issues
```