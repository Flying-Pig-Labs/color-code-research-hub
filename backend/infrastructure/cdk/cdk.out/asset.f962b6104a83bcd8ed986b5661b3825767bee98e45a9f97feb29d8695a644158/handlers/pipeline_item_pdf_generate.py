"""
Generate a PDF-like artifact (HTML stored with .pdf key) for a PipelineRepos item.

Reuses the simple markdown-to-HTML processing approach from report_pdf_generate.py.
Accepts: POST /pipeline-items/{itemId}/pdf
Returns: { pdf_url, cached } with a presigned URL.
"""
import json
import os
import boto3
from io import BytesIO
from datetime import datetime
from boto3.dynamodb.conditions import Attr
from helpers.auth import get_user, AuthError
from helpers.http import json_response
import html

dynamo = boto3.resource('dynamodb')
s3 = boto3.client('s3')

PIPELINE_REPOS_TABLE = os.environ.get('PIPELINE_REPOS_TABLE', 'PipelineRepos')
RESEARCH_BUCKET = os.environ.get('RESEARCH_BUCKET', '')


def handler(event, context):
    # Auth
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})

    # Validate inputs
    item_id = (event.get('pathParameters') or {}).get('itemId')
    if not item_id:
        return json_response(400, {"error": "itemId required"})
    if not RESEARCH_BUCKET:
        return json_response(500, {"error": "RESEARCH_BUCKET not configured"})

    # Load item from PipelineRepos
    table = dynamo.Table(PIPELINE_REPOS_TABLE)
    # Scan by id (legacy table without id as PK). Filter by user where possible.
    user_id = claims.get('sub')
    username = claims.get('email') or claims.get('sub')
    # Handle composite id for issues e.g. 'ISSUE#123:reponame'
    filter_expr = Attr('id').eq(item_id) | Attr('repoId').eq(item_id) | Attr('repoName').eq(item_id) | Attr('itemType').eq(item_id)
    if ':' in item_id and item_id.startswith('ISSUE#'):
        try:
            issue_part, repo_part = item_id.split(':', 1)
            filter_expr = Attr('itemType').eq(issue_part) & Attr('repoName').eq(repo_part)
        except Exception:
            pass
    try:
        scan = table.scan(FilterExpression=filter_expr)
    except Exception as e:
        return json_response(500, {"error": "scan_failed", "detail": str(e)})
    items = scan.get('Items', [])
    if not items:
        return json_response(404, {"error": "item_not_found"})
    item = items[0]

    # Basic ownership check (best-effort)
    owner_user_id = item.get('userId')
    owner_username = item.get('username')
    if owner_user_id and owner_user_id != user_id:
        return json_response(403, {"error": "forbidden"})
    if owner_username and owner_user_id is None and username and owner_username != username and username.split('@')[0] != owner_username:
        return json_response(403, {"error": "forbidden"})

    # Prepare content
    body_md = item.get('body') or ''
    title = item.get('title') or item.get('name') or item.get('repoName') or f"Pipeline Item {item_id}"

    html_content = generate_html_from_markdown(title, body_md, item)

    # Store as HTML with .pdf key (consistent with existing report generator behavior)
    key = f"pipeline/{item_id}/item.pdf"
    try:
        # Check if exists
        try:
            s3.head_object(Bucket=RESEARCH_BUCKET, Key=key)
            pdf_url = s3.generate_presigned_url('get_object', Params={'Bucket': RESEARCH_BUCKET, 'Key': key}, ExpiresIn=3600)
            return json_response(200, {"pdf_url": pdf_url, "cached": True})
        except Exception:
            pass
        buf = BytesIO(html_content.encode('utf-8'))
        s3.put_object(Bucket=RESEARCH_BUCKET, Key=key, Body=buf.getvalue(), ContentType='text/html', CacheControl='max-age=3600', Metadata={'itemId': item_id})
        pdf_url = s3.generate_presigned_url('get_object', Params={'Bucket': RESEARCH_BUCKET, 'Key': key}, ExpiresIn=3600)
        return json_response(200, {"pdf_url": pdf_url, "cached": False})
    except Exception as e:
        return json_response(500, {"error": "write_failed", "detail": str(e)})


def generate_html_from_markdown(title: str, markdown: str, meta: dict) -> str:
    created_at = meta.get('createdAt') or meta.get('timestamp')
    if isinstance(created_at, (int, float)):
        try:
            created_at_str = datetime.fromtimestamp(int(created_at)/1000).strftime('%B %d, %Y at %I:%M %p')
        except Exception:
            created_at_str = datetime.now().strftime('%B %d, %Y at %I:%M %p')
    else:
        created_at_str = datetime.now().strftime('%B %d, %Y at %I:%M %p')

    processed = process_content_for_html(markdown)
    html_out = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <title>{html.escape(title)}</title>
    <style>
      body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #111; padding: 24px; }}
      .header {{ border-bottom: 2px solid #1e40af; margin-bottom: 24px; padding-bottom: 8px; }}
      .title {{ font-size: 22px; color: #1e40af; font-weight: bold; }}
      .meta {{ color: #555; font-size: 12px; margin-top: 4px; }}
      h1, h2, h3 {{ color: #333; }}
      pre, code {{ background: #f6f6f6; padding: 2px 4px; border-radius: 4px; }}
      .content p {{ margin: 10px 0; }}
    </style>
  </head>
  <body>
    <div class=\"header\"> 
      <div class=\"title\">{html.escape(title)}</div>
      <div class=\"meta\">Generated: {created_at_str}</div>
    </div>
    <div class=\"content\">{processed}</div>
  </body>
</html>
"""
    return html_out


def process_content_for_html(content: str) -> str:
    if not content:
        return '<p>No content available.</p>'
    content = html.escape(content)
    # Very light markdown handling: headings and paragraphs
    lines = content.split('\n')
    out = []
    for line in lines:
        s = line.strip()
        if s.startswith('### '):
            out.append(f"<h3>{s[4:]}</h3>")
        elif s.startswith('## '):
            out.append(f"<h2>{s[3:]}</h2>")
        elif s.startswith('# '):
            out.append(f"<h1>{s[2:]}</h1>")
        else:
            if s:
                out.append(f"<p>{line}</p>")
            else:
                out.append('<br/>')
    return '\n'.join(out)
