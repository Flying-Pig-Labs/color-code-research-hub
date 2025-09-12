const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const PDFDocument = require('pdfkit');
const { marked } = require('marked');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET = process.env.RESEARCH_BUCKET;

function renderPdfBuffer({ title, subtitle, paragraphs, disclaimer, markdown }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(title, { underline: true });
    if (subtitle) doc.moveDown(0.3).fontSize(12).fillColor('#6b7280').text(subtitle).fillColor('black');

    doc.moveDown();
    if (markdown) {
      renderMarkdown(doc, markdown);
    } else {
      (paragraphs || []).forEach(p => {
        doc.fontSize(11).text(p, { align: 'left' }).moveDown(0.5);
      });
    }

    if (disclaimer) {
      doc.moveDown().fontSize(9).fillColor('#ef4444').text(disclaimer, { align: 'left' }).fillColor('black');
    }

    doc.end();
  });
}

function renderMarkdown(doc, md) {
  const tokens = marked.lexer(md);
  const renderTokens = (toks) => {
    toks.forEach(tok => {
      switch (tok.type) {
        case 'heading':
          doc.moveDown(0.3);
          doc.fontSize(tok.depth === 1 ? 18 : tok.depth === 2 ? 16 : 14).text(tok.text, { underline: tok.depth === 1 });
          doc.moveDown(0.2);
          break;
        case 'paragraph':
          doc.fontSize(11).text(tok.text, { align: 'left' }).moveDown(0.4);
          break;
        case 'list':
          tok.items.forEach(item => {
            const bullet = tok.ordered ? `${item.index}.` : '•';
            doc.fontSize(11).text(`${bullet} ${item.text}`, { indent: 10 }).moveDown(0.2);
          });
          doc.moveDown(0.2);
          break;
        case 'code':
          doc.moveDown(0.2);
          doc.font('Courier').fontSize(10).text(tok.text, { width: 500, continued: false });
          doc.font('Helvetica');
          doc.moveDown(0.4);
          break;
        case 'blockquote':
          doc.fontSize(11).fillColor('#6b7280').text(tok.text, { indent: 15, width: 480, align: 'left' }).fillColor('black').moveDown(0.4);
          break;
        case 'hr':
          doc.moveDown(0.2);
          doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
          doc.moveDown(0.4);
          break;
        default:
          // ignore other types or handle as plain text
          if (tok.text) {
            doc.fontSize(11).text(tok.text).moveDown(0.2);
          }
          break;
      }
    });
  };
  renderTokens(tokens);
}

async function fetchMarkdownFromUrl(url) {
  // Try to convert GitHub blob URL to raw if needed
  let rawUrl = url;
  const m = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/);
  if (m) {
    const [, owner, repo, ref, path] = m;
    rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  }
  const res = await fetch(rawUrl);
  if (!res.ok) throw new Error(`Failed to fetch markdown: ${res.status}`);
  return await res.text();
}

exports.handler = async (event) => {
  const body = typeof event === 'string' ? JSON.parse(event) : (event.body ? JSON.parse(event.body) : event);
  const kind = body.kind; // 'report' | 'double'
  const userId = body.userId;
  const projectId = body.projectId;
  const reportId = body.reportId;
  const doubleId = body.doubleId;

  if (!BUCKET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing RESEARCH_BUCKET' }) };
  }

  let key, title, subtitle, paragraphs, disclaimer;
  let markdown = body.markdown;
  if (!markdown && body.markdownUrl) {
    markdown = await fetchMarkdownFromUrl(body.markdownUrl);
  }
  if (kind === 'report' && reportId) {
    key = `u/${userId}/p/${projectId}/report/${reportId}/report.pdf`;
    title = 'Research Report';
    subtitle = `Report ID: ${reportId}`;
    paragraphs = body.paragraphs || ['This is an automatically generated report.'];
  } else if (kind === 'double' && doubleId) {
    key = `u/${userId}/p/${projectId}/double/${doubleId}/final.pdf`;
    title = 'Double-Down Deliverable';
    subtitle = `Double ID: ${doubleId}`;
    paragraphs = body.paragraphs || ['This is an automatically generated final deliverable.'];
    disclaimer = 'Informational only; not legal advice; user must file & pay fees via USPTO Patent Center.';
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payload' }) };
  }

  const pdf = await renderPdfBuffer({ title, subtitle, paragraphs, disclaimer, markdown });
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: pdf, ContentType: 'application/pdf' }));
  return { statusCode: 200, body: JSON.stringify({ key }) };
};
