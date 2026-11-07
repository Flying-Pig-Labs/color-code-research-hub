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

    # Safely embed markdown string for client-side rendering (tables, bold/italics, mermaid)
    md_json = json.dumps(markdown or '')
    page = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>{html.escape(title)}</title>
    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/github-markdown-css@5.2.0/github-markdown.min.css\" />
    <style>
      body {{ padding: 24px; font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace; }}
      .doc-header {{ border-bottom: 2px solid #1e40af; margin-bottom: 16px; padding-bottom: 8px; }}
      .doc-title {{ font-size: 22px; color: #1e40af; font-weight: bold; }}
      .doc-meta {{ color: #555; font-size: 12px; margin-top: 4px; }}
      .markdown-body {{ box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace; }}
      .markdown-body table {{ display: table; width: 100%; }}
      .markdown-body code {{ background: #f6f8fa; padding: 2px 4px; border-radius: 4px; font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace; }}
    </style>
    <script src=\"https://cdn.jsdelivr.net/npm/marked/marked.min.js\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js\"></script>
  </head>
  <body>
    <div class=\"doc-header\"> 
      <div class=\"doc-title\">{html.escape(title)}</div>
      <div class=\"doc-meta\">Generated: {created_at_str}</div>
    </div>
    <article id=\"md-root\" class=\"markdown-body\"></article>
    <script>
      (function() {{
        const md = {md_json};
        // Render markdown to HTML with tables support
        marked.use({{ breaks: false, gfm: true }})
        let html = marked.parse(md);
        // Convert ```mermaid blocks into <div class="mermaid">...</div>
        const container = document.getElementById('md-root');
        container.innerHTML = html;
        // Replace code blocks with language-mermaid
        const blocks = container.querySelectorAll('pre code.language-mermaid');
        blocks.forEach((code) => {{
          const parent = code.parentElement;
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.textContent = code.textContent || '';
          parent.replaceWith(div);
        }});
        try {{
          mermaid.initialize({{ startOnLoad: false, theme: 'neutral' }});
          mermaid.init(undefined, container.querySelectorAll('.mermaid'));
        }} catch (e) {{ console.warn('Mermaid init failed', e); }}
      }})();
    </script>
  </body>
</html>
"""
    return page
