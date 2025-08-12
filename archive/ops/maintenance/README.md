# Scripts

Maintenance and utility scripts for data management and local workflows. Many scripts operate on S3 and DynamoDB used by the research/report pipeline.

## Common scripts

- `s3-tenant-migration.cjs` / `s3-batch-migration.sh`: Migrate S3 objects to the unified path layout
- `cleanup-s3-bucket.py` / `cleanup-s3-bucket-auto.py`: Clean S3 buckets with safety rules
- `clean-all-dynamodb.cjs` / `cleanup-dynamodb.cjs`: Remove or tidy DynamoDB records
- `backfill-summaries.cjs` / `process-report.cjs`: Generate or re-process report summaries
- `delete-report.cjs` / `batch-delete-reports.cjs` / `delete-all-reports.cjs`: Remove reports
- `review-reports.cjs`: Inspect reports interactively
- `start.js`: Frontend/Dev bootstrap

## Usage

```bash
# Example: run a Node CJS script
node scripts/review-reports.cjs

# Example: run a Python script
python3 scripts/cleanup-s3-bucket.py
```

## Safety

- Many scripts are destructive. Double-check bucket/table names and AWS profile/region before execution.
- Prefer running against a test environment.
