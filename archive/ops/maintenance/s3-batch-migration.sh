#!/bin/bash

# S3 Batch Migration Script for User-Based Structure
# This script uses AWS CLI for faster parallel migration

BUCKET="color-code-research-results-984906149037"
USER_ID="${1:-fprior}"
PROFILE="mvp"
MAX_PARALLEL=50

echo "S3 Batch Migration to User-Based Structure"
echo "=========================================="
echo "Bucket: $BUCKET"
echo "User: $USER_ID"
echo "Profile: $PROFILE"
echo ""

# Function to migrate a single file
migrate_file() {
    local old_key=$1
    local new_key=$2
    
    # Copy to new location
    aws s3 cp "s3://$BUCKET/$old_key" "s3://$BUCKET/$new_key" \
        --profile $PROFILE \
        --metadata-directive COPY \
        --no-progress >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ $old_key → $new_key"
        
        # Tag old file for deletion
        aws s3api put-object-tagging \
            --bucket $BUCKET \
            --key "$old_key" \
            --tagging 'TagSet=[{Key=Migration,Value=completed},{Key=MigratedTo,Value='"$new_key"'},{Key=DeleteAfter,Value=30days}]' \
            --profile $PROFILE >/dev/null 2>&1
    else
        echo "✗ Failed: $old_key"
    fi
}

export -f migrate_file
export BUCKET PROFILE USER_ID

# Migrate research files
echo "Migrating research files..."
aws s3 ls "s3://$BUCKET/research/" --recursive --profile $PROFILE | \
    grep -E '\.json$' | \
    awk '{print $4}' | \
    while read old_key; do
        # Extract parts from research/{timestamp}_{id}.json
        filename=$(basename "$old_key")
        if [[ $filename =~ ^([0-9]{8})_([0-9]{6})_(.+)\.json$ ]]; then
            date_part="${BASH_REMATCH[1]}"
            time_part="${BASH_REMATCH[2]}"
            id_part="${BASH_REMATCH[3]}"
            
            year="${date_part:0:4}"
            month="${date_part:4:2}"
            day="${date_part:6:2}"
            
            new_key="users/$USER_ID/personal/research/$year/$month/$day/${time_part}/response.json"
            
            echo "$old_key|$new_key"
        fi
    done | \
    xargs -P $MAX_PARALLEL -I {} bash -c '
        IFS="|" read old_key new_key <<< "{}"
        migrate_file "$old_key" "$new_key"
    '

# Count results
echo ""
echo "Migration Summary:"
echo "=================="
migrated_count=$(aws s3 ls "s3://$BUCKET/users/$USER_ID/personal/research/" --recursive --profile $PROFILE | wc -l)
echo "Files migrated: $migrated_count"

# Check for reports
report_count=$(aws s3 ls "s3://$BUCKET/reports/" --recursive --profile $PROFILE 2>/dev/null | wc -l)
if [ $report_count -gt 0 ]; then
    echo ""
    echo "Note: Found $report_count report files that may need migration"
    echo "Run: aws s3 ls s3://$BUCKET/reports/ --recursive --profile $PROFILE"
fi