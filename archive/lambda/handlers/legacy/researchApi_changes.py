# Key changes to make in researchApi.py

# CHANGE 1: Update the upload function (replace lines 64-96)
def upload_to_s3(content: str, metadata: Dict[str, Any], research_id: str, user_id: str = "fprior") -> Dict[str, str]:
    """Upload research results to S3 with new structure."""
    try:
        # Create S3 prefix for this research
        s3_prefix = f"users/{user_id}/research/{research_id}"
        
        # Upload response file
        response_key = f"{s3_prefix}/response.json"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=response_key,
            Body=json.dumps({
                "research_id": research_id,
                "content": content,
                "timestamp": datetime.now().isoformat(),
                "metadata": metadata
            }, indent=2),
            ContentType="application/json"
        )
        
        print(f"Successfully uploaded to S3: {S3_BUCKET}/{response_key}")
        return {
            "s3_prefix": s3_prefix,
            "response_key": response_key
        }
        
    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        raise


# CHANGE 2: In the main handler (around line 540-560), update how you generate research_id:
# Replace:
#     research_id = str(uuid.uuid4())[:8]
# With:
research_id = f"research_{uuid.uuid4().hex[:12]}"

# And update the upload call:
# Replace:
#     s3_key = upload_to_s3(research_content, metadata)
# With:
user_id = event.get('headers', {}).get('X-User-Id', 'fprior')
s3_info = upload_to_s3(research_content, metadata, research_id, user_id)
s3_prefix = s3_info['s3_prefix']


# CHANGE 3: Update DynamoDB storage (around line 570-590)
# Add s3Prefix to the item:
table.put_item(
    Item={
        "reportId": research_id,
        "userId": user_id,
        "s3Prefix": s3_prefix,  # <-- ADD THIS
        "s3Bucket": S3_BUCKET,  # <-- ADD THIS
        "team": team,
        "requester": requester_name,
        "requestDetails": json.dumps(metadata),
        "status": "completed",
        "createdAt": datetime.now().isoformat(),
        "contentSummary": content_summary,
        "wordCount": len(research_content.split()),
        "ttl": int((datetime.now() + timedelta(days=90)).timestamp()),
    }
)