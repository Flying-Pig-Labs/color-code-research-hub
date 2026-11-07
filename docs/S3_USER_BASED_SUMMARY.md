# S3 User-Based Organization Summary

## Quick Overview

Instead of organizing by abstract "tenants", we're organizing by **users** (like `fprior`) as the primary scope. This makes the system more intuitive and user-friendly.

## New Structure at a Glance

```
users/
├── fprior/
│   ├── personal/               # Quick personal research
│   │   ├── research/
│   │   └── reports/
│   └── projects/               # Organized project work
│       └── ocean-studio-mvp/
│           ├── research/
│           ├── reports/
│           └── plans/
├── jsmith/
│   ├── personal/
│   └── projects/
teams/
├── red-team/
│   └── projects/               # Shared team projects
organizations/
├── ocean-studio/
│   ├── users/                  # Org user management
│   └── projects/               # Org-wide projects
```

## Key Benefits

1. **Intuitive**: Users immediately understand "their" space
2. **Personal Workspace**: Quick area for drafts and experiments
3. **Project Organization**: Formal work gets properly organized
4. **Easy Sharing**: Clear collaboration model via projects
5. **Scalable**: Works for individuals up to large organizations

## Migration Commands

### View what would be migrated (dry run):
```bash
cd scripts
node s3-tenant-migration.cjs --dry-run --user-id=fprior
```

### Migrate to personal workspace:
```bash
node s3-tenant-migration.cjs --user-id=fprior --scope=personal
```

### Migrate to a specific project:
```bash
node s3-tenant-migration.cjs --user-id=fprior --scope=project --project-id=ocean-studio-mvp
```

### Migrate team reports:
```bash
node s3-tenant-migration.cjs --user-id=fprior --scope=team --project-id=team-research
```

## Access Patterns

### Personal Research
- Path: `/users/fprior/personal/research/2024/01/15/{id}/`
- Use: Quick research, drafts, experiments
- Access: Private to user

### Project Work
- Path: `/users/fprior/projects/ocean-studio-mvp/reports/2024/01/15/{id}/`
- Use: Formal project deliverables
- Access: User + collaborators

### Team Projects
- Path: `/teams/red-team/projects/q1-research/reports/2024/01/15/{id}/`
- Use: Shared team work
- Access: All team members

## Implementation Priority

1. **Phase 1**: Update Lambda functions to use user context
2. **Phase 2**: Add user detection from API keys/JWT
3. **Phase 3**: Migrate existing data with user assignments
4. **Phase 4**: Add project/team management UI

## Example User Profile

```json
{
  "userId": "fprior",
  "email": "fprior@oceanstudio.io",
  "name": "F Prior",
  "defaultProject": "ocean-studio-mvp",
  "personalQuota": {
    "monthlyReports": 50,
    "storageGB": 10
  },
  "projects": [
    {
      "projectId": "ocean-studio-mvp",
      "role": "owner",
      "created": "2024-01-01"
    }
  ],
  "teams": ["red-team", "research-team"]
}
```

## Next Steps

1. **Confirm User ID Format**: Should we use `fprior` or email-based IDs?
2. **Default Scope**: Should new research default to personal or project?
3. **Team Structure**: How should team ownership/membership work?
4. **Migration Strategy**: Batch migrate or gradual transition?