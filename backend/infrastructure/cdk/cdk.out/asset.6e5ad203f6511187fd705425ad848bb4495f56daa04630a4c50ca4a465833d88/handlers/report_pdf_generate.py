"""
Generate PDF from research report using ReportLab.
This handler creates a professional PDF version of the report with proper styling.
"""
import json
import os
import boto3
import tempfile
from io import BytesIO
from datetime import datetime
from helpers.auth import get_user, AuthError
from helpers.http import json_response

# Simple HTML to PDF conversion using built-in libraries
import html
import re

s3 = boto3.client('s3')
dynamo = boto3.resource('dynamodb')

RESEARCH_BUCKET = os.environ.get('RESEARCH_BUCKET', '')
RESEARCH_REPORTS_TABLE = os.environ.get('RESEARCH_REPORTS_TABLE', 'ResearchReports')

def handler(event, context):
    """Generate PDF for a research report"""
    try:
        # Authentication
        claims = get_user(event)
        username = claims.get('name') or claims.get('email') or claims.get('sub')
        if username == 'priorww@gmail.com':
            username = 'fprior'
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    
    # Extract report ID from path
    report_id = (event.get('pathParameters') or {}).get('reportId')
    if not report_id:
        return json_response(400, {"error": "reportId required"})
    
    try:
        # Always (re)generate HTML-PDF and overwrite the S3 object to avoid stale content
        pdf_key = f"reports/{report_id}/report.pdf"
        
        # Get report data from DynamoDB
        table = dynamo.Table(RESEARCH_REPORTS_TABLE)
        response = table.get_item(Key={'reportId': report_id})
        report_item = response.get('Item')
        
        if not report_item:
            return json_response(404, {"error": "Report not found"})
        
        # Check ownership
        owner_username = report_item.get('username')
        if owner_username != username:
            return json_response(403, {"error": "Access denied"})
        
        # Get full report content from S3
        s3_key = report_item.get('s3ReportKey') or report_item.get('s3Key')
        if not s3_key:
            return json_response(404, {"error": "Report content not found"})
        
        try:
            obj = s3.get_object(Bucket=RESEARCH_BUCKET, Key=s3_key)
            content = obj['Body'].read().decode('utf-8', errors='replace')
        except Exception as e:
            return json_response(500, {"error": "Failed to load report content", "detail": str(e)})
        
        # Generate HTML version first, then convert to "PDF" (actually formatted HTML)
        html_content = generate_html_report(report_item, content, report_id)
        
        # For now, store as HTML file that looks like a PDF
        html_buffer = BytesIO(html_content.encode('utf-8'))
        
        # Upload HTML to S3 as "PDF"
        s3.put_object(
            Bucket=RESEARCH_BUCKET,
            Key=pdf_key,
            Body=html_buffer.getvalue(),
            ContentType='text/html; charset=utf-8',
            CacheControl='no-cache, no-store, must-revalidate',
            Metadata={
                'reportId': report_id,
                'generatedAt': datetime.now().isoformat(),
                'username': username
            }
        )

        # Generate presigned URL
        pdf_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': RESEARCH_BUCKET, 'Key': pdf_key},
            ExpiresIn=3600
        )
        
        return json_response(200, {
            "pdf_url": pdf_url,
            "cached": False,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"PDF generation error: {e}")
        return json_response(500, {"error": "PDF generation failed", "detail": str(e)})

def generate_html_report(report_item, content, report_id):
    """Generate an HTML report using the same markdown rendering style as Pipeline PDFs."""
    title = report_item.get('title') or report_item.get('objective') or f"Research Report {report_id}"
    processed_summary = report_item.get('processedSummary', '')
    team = (report_item.get('team') or 'general').upper()
    status = report_item.get('status', 'completed').title()

    # Format creation date
    created_at_str = 'N/A'
    if report_item.get('createdAt'):
        try:
            created_at = datetime.fromisoformat(report_item['createdAt'].replace('Z', '+00:00'))
            created_at_str = created_at.strftime('%B %d, %Y at %I:%M %p')
        except Exception:
            pass

    md_json = json.dumps(content or '')

    html_output = f"""
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
      html, body {{ background: #ffffff !important; color: #111827 !important; }}
      body {{ padding: 24px; font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .doc-header {{ border-bottom: 2px solid #1e40af; margin-bottom: 16px; padding-bottom: 8px; }}
      .doc-title {{ font-size: 22px; color: #1e40af; font-weight: bold; }}
      .doc-meta {{ color: #555; font-size: 12px; margin-top: 4px; }}
      .markdown-body {{ box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace; background: #ffffff !important; color: #111827 !important; word-break: break-word; overflow-wrap: anywhere; }}
      .markdown-body *, .markdown-body *::before, .markdown-body *::after {{ background-color: #ffffff !important; color: #111827 !important; }}
      .markdown-body a {{ color: #1d4ed8 !important; word-break: break-all; overflow-wrap: anywhere; }}
      .markdown-body p, .markdown-body li {{ word-break: break-word; overflow-wrap: anywhere; hyphens: auto; }}
      .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {{ color: #111827; }}
      .markdown-body table {{ display: table; width: 100%; border-collapse: collapse !important; table-layout: fixed !important; background: #ffffff !important; border-color: #e5e7eb !important; }}
      .markdown-body thead th {{ background: #f3f4f6 !important; color: #111827 !important; border-color: #e5e7eb !important; }}
      .markdown-body tbody tr {{ background: #ffffff !important; }}
      .markdown-body tbody tr:nth-child(2n) {{ background: #f9fafb !important; }}
      .markdown-body th, .markdown-body td {{ background: #ffffff !important; color: #111827 !important; border: 1px solid #e5e7eb !important; padding: 8px; word-break: break-word; overflow-wrap: anywhere; }}
      .summary-box {{ background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 12px 0 24px; }}
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
      <div class=\"doc-meta\">Report ID: {html.escape(report_id)} • Team: {html.escape(team)} • Status: {html.escape(status)} • Created: {html.escape(created_at_str)}</div>
    </div>

    {f'<div class="summary-box">{html.escape(processed_summary)}</div>' if processed_summary else ''}

    <article id=\"md-root\" class=\"markdown-body\"></article>
    <script>
      (function() {{
        const md = {md_json};
        marked.use({{ breaks: false, gfm: true }});
        const container = document.getElementById('md-root');
        container.innerHTML = marked.parse(md);
        // Remove duplicate H1 if it matches the document title
        try {{
          const firstEl = container.firstElementChild;
          const docTitle = (document.querySelector('.doc-title')?.textContent || '').trim().toLowerCase();
          if (firstEl && firstEl.tagName === 'H1') {{
            const h1Text = (firstEl.textContent || '').trim().toLowerCase();
            if (!docTitle || h1Text === docTitle) firstEl.remove();
          }}
        }} catch (e) {{ console.warn('Title dedupe failed', e); }}
        // Mermaid blocks
        const blocks = container.querySelectorAll('pre code.language-mermaid');
        blocks.forEach((code) => {{
          const parent = code.parentElement; const div = document.createElement('div');
          div.className = 'mermaid'; div.textContent = code.textContent || '';
          parent.replaceWith(div);
        }});
        try {{ mermaid.initialize({{ startOnLoad: false, theme: 'neutral' }}); mermaid.init(undefined, container.querySelectorAll('.mermaid')); }} catch (e) {{ console.warn('Mermaid init failed', e); }}
      }})();
    </script>
  </body>
</html>
"""
    return html_output

def process_content_for_html(content):
    """Convert plain text content to formatted HTML"""
    if not content:
        return '<p>No content available.</p>'
    
    # Escape HTML
    content = html.escape(content)
    
    # Convert line breaks to paragraphs
    paragraphs = content.split('\n\n')
    formatted_paragraphs = []
    
    for para in paragraphs:
        if para.strip():
            # Check if it looks like a heading
            if para.strip().startswith('#'):
                # Remove markdown heading symbols
                heading_text = para.strip().lstrip('#').strip()
                formatted_paragraphs.append(f'<h2>{heading_text}</h2>')
            else:
                # Convert single line breaks to <br> within paragraphs
                formatted_para = para.replace('\n', '<br>')
                formatted_paragraphs.append(f'<p>{formatted_para}</p>')
    
    return '\n'.join(formatted_paragraphs)
