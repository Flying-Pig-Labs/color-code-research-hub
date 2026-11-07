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
from urllib.parse import unquote

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
    # URL-decode path parameter to handle ISSUE%23n%3Arepo cases
    try:
        item_id = unquote(item_id)
    except Exception:
        pass
    if not RESEARCH_BUCKET:
        return json_response(500, {"error": "RESEARCH_BUCKET not configured"})

    # Load item from PipelineRepos
    table = dynamo.Table(PIPELINE_REPOS_TABLE)
    # Scan by id (legacy table without id as PK). Filter by user where possible.
    user_id = claims.get('sub')
    username = claims.get('email') or claims.get('name') or claims.get('sub')
    # Legacy mapping for username normalization
    if username == 'priorww@gmail.com':
        username = 'fprior'
    # Handle composite id for issues e.g. 'ISSUE#123:reponame'
    filter_expr = (
        Attr('id').eq(item_id) |
        Attr('repoId').eq(item_id) |
        Attr('repoName').eq(item_id) |
        Attr('name').eq(item_id) |
        Attr('itemType').eq(item_id)
    )
    if ':' in item_id and item_id.startswith('ISSUE#'):
        try:
            issue_part, repo_part = item_id.split(':', 1)
            # First try strict match on itemType and repoName
            filter_expr = Attr('itemType').eq(issue_part) & Attr('repoName').eq(repo_part)
        except Exception:
            pass
    try:
        scan = table.scan(FilterExpression=filter_expr)
    except Exception as e:
        return json_response(500, {"error": "scan_failed", "detail": str(e)})
    items = scan.get('Items', [])
    # Composite ISSUE case: e.g., 'ISSUE#1:reponame' — scan by itemType then match repoName or URL
    if not items and ':' in item_id and item_id.startswith('ISSUE#'):
        try:
            issue_part, repo_part = item_id.split(':', 1)
            # Broaden to begins_with on itemType in case of suffixes
            scan2 = table.scan(FilterExpression=Attr('itemType').begins_with(issue_part))
            cand = scan2.get('Items', [])
            num = issue_part.split('#', 1)[1]
            matched = []
            for it in cand:
                rn = (it.get('repoName') or it.get('repo_name') or it.get('name') or '').strip()
                if rn and rn.lower() == repo_part.strip().lower():
                    matched.append(it)
                    continue
                urlv = (it.get('url') or it.get('github_url') or it.get('issueUrl') or it.get('html_url') or '').strip()
                if urlv and f"/{repo_part.lower()}/issues/{num}" in urlv.lower():
                    matched.append(it)
                fn = (it.get('fullName') or it.get('full_name') or '').strip()
                if fn and fn.lower().endswith(f"/{repo_part.lower()}"):
                    matched.append(it)
            items = matched
            # If still nothing, last resort: scan by URL contains path without number
            if not items:
                pattern = f"/{repo_part.lower()}/issues/"
                try:
                    scan3 = table.scan()
                    cand2 = scan3.get('Items', [])
                    # Filter in-memory to ones also matching itemType prefix
                    def any_url_contains(x: dict, pat: str) -> bool:
                        for k in ('url','github_url','issueUrl','html_url'):
                            v = str(x.get(k,'')).lower()
                            if pat in v:
                                return True
                        return False
                    items = [it for it in cand2 if (any_url_contains(it, pattern) and str(it.get('itemType','')).startswith(issue_part))]
                except Exception:
                    pass
        except Exception:
            items = []
    # If still not found and not ISSUE composite, try relaxed repo name/url match
    if not items and not (':' in item_id and item_id.startswith('ISSUE#')):
        try:
            scan_all = table.scan()
            cand_all = scan_all.get('Items', [])
            q = (item_id or '').strip().lower()
            for it in cand_all:
                rn = (it.get('repoName') or it.get('name') or '').strip().lower()
                fn = (it.get('fullName') or it.get('full_name') or '').strip().lower()
                ru = (it.get('repoUrl') or it.get('url') or it.get('htmlUrl') or '').strip().lower()
                if (rn and rn == q) or (fn and fn.endswith('/'+q)) or (ru and ru.endswith('/'+q)):
                    items = [it]
                    break
        except Exception:
            pass
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

    try:
        html_content = generate_html_from_markdown(title, body_md, item)
    except Exception as e:
        return json_response(500, {"error": "render_failed", "detail": str(e)})

    # Store as HTML with .pdf key (consistent with existing report generator behavior)
    key = f"pipeline/{item_id}/item.pdf"
    try:
        # Always overwrite to avoid serving stale markup
        buf = BytesIO(html_content.encode('utf-8'))
        s3.put_object(
            Bucket=RESEARCH_BUCKET,
            Key=key,
            Body=buf.getvalue(),
            ContentType='text/html; charset=utf-8',
            CacheControl='no-cache, no-store, must-revalidate',
            Metadata={'itemId': item_id}
        )
        pdf_url = s3.generate_presigned_url('get_object', Params={'Bucket': RESEARCH_BUCKET, 'Key': key}, ExpiresIn=3600)
        return json_response(200, {"pdf_url": pdf_url, "cached": False})
    except Exception as e:
        return json_response(500, {"error": "write_failed", "detail": str(e)})


def _normalize_markdown(md: str) -> str:
    if not md:
        return ''
    s = md.strip('\n')
    for fh in ('```markdown', '```md', '```gfm', '```text', '```'):
        if s.startswith(fh):
            s = '\n'.join(s.splitlines()[1:])
            break
    if s.endswith('```'):
        lines = s.splitlines()
        if lines:
            lines = lines[:-1]
        s = '\n'.join(lines)
    s = s.replace('\r\n', '\n').replace('\r', '\n')
    # Trim common indentation
    lines = s.split('\n')
    lead = None
    for ln in lines:
        if ln.strip():
            count = len(ln) - len(ln.lstrip(' '))
            lead = count if lead is None else min(lead, count)
    if lead and lead > 0:
        lines = [ln[lead:] if ln.startswith(' ' * lead) else ln for ln in lines]
    return '\n'.join(lines).strip('\n')


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
    md_json = json.dumps(_normalize_markdown(markdown or ''))
    page = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>{html.escape(title)}</title>
    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/github-markdown-css@5.2.0/github-markdown-light.min.css\" />
    <meta name=\"color-scheme\" content=\"light\" />
    <style>
      @page {{ size: auto; margin: 0.75in; }}
      :root {{ color-scheme: light; }}
      html, body {{
        background: #ffffff !important;
        color: #111827 !important; /* slate-900 */
      }}
      body {{
        padding: 24px;
        font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }}
      .doc-header {{ border-bottom: 2px solid #1e40af; margin-bottom: 16px; padding-bottom: 8px; }}
      .doc-title {{ font-size: 22px; color: #1e40af; font-weight: bold; }}
      .doc-meta {{ color: #555; font-size: 12px; margin-top: 4px; }}
      .markdown-body {{
        box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto;
        font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
        background: #ffffff !important; color: #111827 !important;
        word-break: break-word; overflow-wrap: anywhere;
      }}
      .markdown-body *, .markdown-body *::before, .markdown-body *::after {{
        background-color: #ffffff !important; color: #111827 !important;
      }}
      .markdown-body a {{ color: #1d4ed8 !important; word-break: break-all; overflow-wrap: anywhere; }}
      .markdown-body p, .markdown-body li {{ word-break: break-word; overflow-wrap: anywhere; hyphens: auto; }}
      .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {{ color: #111827; }}
      .markdown-body table {{ display: table; width: 100%; border-collapse: collapse !important; table-layout: fixed !important; background: #ffffff !important; border-color: #e5e7eb !important; }}
      .markdown-body thead th {{ background: #f3f4f6 !important; color: #111827 !important; border-color: #e5e7eb !important; }}
      .markdown-body tbody tr {{ background: #ffffff !important; }}
      .markdown-body tbody tr:nth-child(2n) {{ background: #f9fafb !important; }}
      .markdown-body th, .markdown-body td {{ background: #ffffff !important; color: #111827 !important; border: 1px solid #e5e7eb !important; padding: 8px; word-break: break-word; overflow-wrap: anywhere; }}
      .markdown-body code {{ background: #f6f8fa; padding: 2px 4px; border-radius: 4px; font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace; color: #111827; word-break: break-word; overflow-wrap: anywhere; }}
      .markdown-body pre {{
        background: #f6f8fa !important; color: #111827 !important; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px;
        overflow: auto; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;
      }}
      .mermaid, .markdown-body .mermaid, .markdown-body svg {{ background: #ffffff !important; color: #111827 !important; }}
      @media print {{
        @page {{ size: auto; margin: 0.75in; }}
        body {{ padding: 0 !important; margin: 0 !important; }}
        .markdown-body {{ margin: 0 !important; }}
        html, body {{ background: #ffffff !important; color: #111827 !important; }}
        .markdown-body {{ background: #ffffff !important; color: #111827 !important; }}
        .markdown-body table {{ background: #ffffff !important; border-color: #111827 !important; }}
        .markdown-body thead th {{ background: #e5e7eb !important; color: #111827 !important; }}
        .markdown-body tbody tr:nth-child(2n) {{ background: #f3f4f6 !important; }}
        .doc-header {{ border-color: #1e40af !important; }}
        .mermaid, .markdown-body .mermaid, .markdown-body svg {{ background: #ffffff !important; color: #111827 !important; }}
      }}
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
        // De-duplicate top-level title: remove first H1 if it matches the document title
        try {{
          const firstEl = container.firstElementChild;
          const docTitle = (document.querySelector('.doc-title')?.textContent || '').trim().toLowerCase();
          if (firstEl && firstEl.tagName === 'H1') {{
            const h1Text = (firstEl.textContent || '').trim().toLowerCase();
            if (!docTitle || h1Text === docTitle) {{
              firstEl.remove();
            }}
          }}
        }} catch (e) {{ console.warn('Title dedupe failed', e); }}
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
