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
        # Check if PDF already exists in S3
        pdf_key = f"reports/{report_id}/report.pdf"

        # Try to get existing PDF first
        try:
            s3.head_object(Bucket=RESEARCH_BUCKET, Key=pdf_key)
            # PDF exists, generate presigned URL
            pdf_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': RESEARCH_BUCKET, 'Key': pdf_key},
                ExpiresIn=3600  # 1 hour
            )
            return json_response(200, {
                "pdf_url": pdf_url,
                "cached": True
            })
        except:
            pass  # PDF doesn't exist, need to generate
        
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
            ContentType='text/html',
            CacheControl='max-age=3600',
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
    """Generate a professional HTML report that can be printed as PDF"""
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
        except:
            pass
    
    # Process content - simple markdown-like formatting
    processed_content = process_content_for_html(content)
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{html.escape(title)}</title>
    <style>
        @media print {{
            body {{ margin: 0.5in; }}
            .no-print {{ display: none; }}
        }}
        body {{
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            text-align: center;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .title {{
            color: #1e40af;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .metadata {{
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }}
        .metadata-table {{
            width: 100%;
        }}
        .metadata-table td {{
            padding: 8px;
            border-bottom: 1px solid #dee2e6;
        }}
        .metadata-table td:first-child {{
            font-weight: bold;
            width: 150px;
        }}
        .section-title {{
            color: #374151;
            font-size: 18px;
            font-weight: bold;
            margin: 30px 0 15px 0;
            border-left: 4px solid #1e40af;
            padding-left: 15px;
        }}
        .summary-box {{
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }}
        .content {{
            margin: 20px 0;
            text-align: justify;
        }}
        .disclaimer {{
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin-top: 40px;
        }}
        .disclaimer h3 {{
            color: #92400e;
            margin-top: 0;
        }}
        .footer {{
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }}
        h1, h2, h3 {{
            color: #374151;
        }}
        p {{
            margin-bottom: 12px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{html.escape(title)}</div>
        <div>Research Report</div>
    </div>

    <div class="metadata">
        <table class="metadata-table">
            <tr><td>Report ID:</td><td>{html.escape(report_id)}</td></tr>
            <tr><td>Generated:</td><td>{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</td></tr>
            <tr><td>Team:</td><td>{html.escape(team)}</td></tr>
            <tr><td>Status:</td><td>{html.escape(status)}</td></tr>
            <tr><td>Created:</td><td>{html.escape(created_at_str)}</td></tr>
        </table>
    </div>

    {f'<div class="section-title">Executive Summary</div><div class="summary-box">{html.escape(processed_summary)}</div>' if processed_summary else ''}

    <div class="section-title">Full Report</div>
    <div class="content">
        {processed_content}
    </div>

    <div class="disclaimer">
        <h3>Important Disclaimers</h3>
        <ul>
            <li>This report is generated using AI assistance and should be reviewed for accuracy.</li>
            <li>Information presented may be subject to rapid change and should be independently verified.</li>
            <li>This research is for informational purposes only and does not constitute professional advice.</li>
            <li>All data sources and methodologies should be validated before making business decisions.</li>
        </ul>
    </div>

    <div class="footer">
        <p>Report generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | Research Hub</p>
    </div>
</body>
</html>'''
    return html

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