#!/usr/bin/env python3
"""
Clean up S3 bucket by removing files older than 1 hour.
This script will list all files, check their age, and delete those older than 1 hour.
"""

import boto3
from datetime import datetime, timezone, timedelta
import sys

# Configuration
BUCKET_NAME = "color-code-research-results-984906149037"
PROFILE_NAME = "mvp"
MAX_AGE_HOURS = 1

def main():
    # Create S3 client with specific profile
    session = boto3.Session(profile_name=PROFILE_NAME)
    s3_client = session.client('s3')
    
    # Calculate cutoff time
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=MAX_AGE_HOURS)
    
    print(f"Cleaning up S3 bucket: {BUCKET_NAME}")
    print(f"Profile: {PROFILE_NAME}")
    print(f"Current time (UTC): {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Cutoff time (UTC): {cutoff_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Files older than {MAX_AGE_HOURS} hour(s) will be deleted")
    print("-" * 80)
    
    # List all objects in the bucket
    paginator = s3_client.get_paginator('list_objects_v2')
    page_iterator = paginator.paginate(Bucket=BUCKET_NAME)
    
    files_to_delete = []
    files_to_keep = []
    total_size_to_delete = 0
    total_size_to_keep = 0
    
    for page in page_iterator:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                last_modified = obj['LastModified']
                size = obj['Size']
                
                # Check if file is older than cutoff time
                if last_modified < cutoff_time:
                    files_to_delete.append(key)
                    total_size_to_delete += size
                    print(f"DELETE: {key} (Modified: {last_modified.strftime('%Y-%m-%d %H:%M:%S')}, Size: {size:,} bytes)")
                else:
                    files_to_keep.append(key)
                    total_size_to_keep += size
                    print(f"KEEP:   {key} (Modified: {last_modified.strftime('%Y-%m-%d %H:%M:%S')}, Size: {size:,} bytes)")
    
    print("-" * 80)
    print(f"Summary:")
    print(f"  Files to delete: {len(files_to_delete)} (Total size: {total_size_to_delete:,} bytes)")
    print(f"  Files to keep: {len(files_to_keep)} (Total size: {total_size_to_keep:,} bytes)")
    
    if not files_to_delete:
        print("\nNo files to delete.")
        return
    
    # Confirm deletion
    response = input(f"\nDo you want to delete {len(files_to_delete)} files? (yes/no): ")
    if response.lower() != 'yes':
        print("Deletion cancelled.")
        return
    
    # Delete files in batches
    print("\nDeleting files...")
    batch_size = 1000  # S3 delete_objects supports up to 1000 keys per request
    
    for i in range(0, len(files_to_delete), batch_size):
        batch = files_to_delete[i:i + batch_size]
        
        # Prepare delete request
        delete_request = {
            'Objects': [{'Key': key} for key in batch]
        }
        
        try:
            response = s3_client.delete_objects(
                Bucket=BUCKET_NAME,
                Delete=delete_request
            )
            
            # Check for errors
            if 'Errors' in response:
                print(f"Errors occurred while deleting:")
                for error in response['Errors']:
                    print(f"  - {error['Key']}: {error['Code']} - {error['Message']}")
            
            deleted_count = len(response.get('Deleted', []))
            print(f"Deleted batch {i//batch_size + 1}: {deleted_count} files")
            
        except Exception as e:
            print(f"Error deleting batch: {str(e)}")
            sys.exit(1)
    
    print(f"\nCleanup completed. Deleted {len(files_to_delete)} files.")

if __name__ == "__main__":
    main()