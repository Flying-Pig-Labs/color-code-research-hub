"""
Refine an idea's Markdown using the highest-available reasoning LLM based on Shark review comments.

Model precedence (best → fallback):
- OpenAI (GPT‑5 high-thinking if configured via OPENAI_MODEL; else GPT‑4.1/gpt‑4o)
- Anthropic Claude (Opus), if OpenAI not configured or call fails

Route: POST /api/ideas/refine
Body: {
  repository: "owner/repo",
  issue_number: 1,
  title?: string,
  issue_body: string,           # original markdown of the issue body
  reviews: [ { review_content: str, decision?: str, investment_amount?: num, confidence_score?: num, shark_name?: str, ... }, ... ]
}
Returns: { refined_markdown: string }
"""
import json
import os
import boto3
import urllib.request
from helpers.auth import get_user, AuthError
from helpers.http import json_response

ANTHROPIC_SECRET_ARN = os.environ.get('ANTHROPIC_API_KEY_SECRET_ARN', '')
OPENAI_SECRET_ARN = os.environ.get('OPENAI_API_KEY_SECRET_ARN', '')
OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4.1')  # override to 'gpt-5-high' if available
secrets = boto3.client('secretsmanager')


def _get_anthropic_key():
    if not ANTHROPIC_SECRET_ARN:
        raise RuntimeError('ANTHROPIC_API_KEY_SECRET_ARN not configured')
    resp = secrets.get_secret_value(SecretId=ANTHROPIC_SECRET_ARN)
    s = resp.get('SecretString') or ''
    try:
        data = json.loads(s)
        key = data.get('anthropic_key') or data.get('api_key') or data.get('ANTHROPIC_API_KEY')
        if key:
            return key
    except Exception:
        pass
    return s.strip()


def _get_openai_key():
    if not OPENAI_SECRET_ARN:
        raise RuntimeError('OPENAI_API_KEY_SECRET_ARN not configured')
    resp = secrets.get_secret_value(SecretId=OPENAI_SECRET_ARN)
    s = resp.get('SecretString') or ''
    try:
        data = json.loads(s)
        key = data.get('openai_key') or data.get('api_key') or data.get('OPENAI_API_KEY')
        if key:
            return key
    except Exception:
        pass
    return s.strip()


def _openai_chat(messages, model=None, temperature=0.2, max_tokens=4000):
    api_key = _get_openai_key()
    url = 'https://api.openai.com/v1/chat/completions'
    payload = {
        'model': model or OPENAI_MODEL,
        'temperature': temperature,
        'max_tokens': max_tokens,
        'messages': messages,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'Bearer {api_key}')
    req.add_header('content-type', 'application/json')
    with urllib.request.urlopen(req, timeout=60) as res:
        if 200 <= res.status < 300:
            return json.loads(res.read().decode('utf-8'))
        raise RuntimeError(f'OpenAI status {res.status}')


def _anthropic_claude(messages, model='claude-3-opus-20240229', temperature=0.2, max_tokens=4000):
    api_key = _get_anthropic_key()
    url = 'https://api.anthropic.com/v1/messages'
    payload = {
        'model': model,
        'max_tokens': max_tokens,
        'temperature': temperature,
        'messages': messages
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('x-api-key', api_key)
    req.add_header('anthropic-version', '2023-06-01')
    req.add_header('content-type', 'application/json')
    with urllib.request.urlopen(req, timeout=60) as res:
        if res.status >= 200 and res.status < 300:
            return json.loads(res.read().decode('utf-8'))
        raise RuntimeError(f'Anthropic status {res.status}')


def handler(event, context):
    try:
        _ = get_user(event)
    except AuthError:
        return json_response(401, { 'error': 'unauthorized' })

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return json_response(400, { 'error': 'invalid_json' })

    repo = (body.get('repository') or '').strip()
    issue_number = body.get('issue_number')
    issue_body = body.get('issue_body') or ''
    title = body.get('title') or ''
    reviews = body.get('reviews') or []
    if not repo or not issue_number or not issue_body:
        return json_response(422, { 'error': 'repository, issue_number, and issue_body required' })

    # Build prompt as per spec
    review_texts = []
    for r in reviews:
        txt = str(r.get('review_content') or r.get('review') or '').strip()
        if not txt:
            continue
        meta = []
        if r.get('decision'): meta.append(f"decision: {r['decision']}")
        if r.get('investment_amount') is not None: meta.append(f"investment: {r['investment_amount']}")
        if r.get('confidence_score') is not None: meta.append(f"confidence: {r['confidence_score']}")
        if r.get('shark_name'): meta.append(f"shark: {r['shark_name']}")
        header = f"[{' | '.join(meta)}]" if meta else ''
        review_texts.append(f"{header}\n{txt}")
    reviews_block = "\n\n".join(review_texts) if review_texts else "(no shark review comments provided)"

    system = (
        "You are a principal product strategist performing deep, careful reasoning to improve a product idea, "
        "strictly grounded in provided Shark review comments. You must preserve the idea's core intent and structure.\n"
        "Rules:\n"
        "- Apply only thoughtful, iterative improvements; do not pivot the concept.\n"
        "- Preserve all sections, headings, table of contents, tables, and code/mermaid blocks.\n"
        "- Update mermaid diagrams only if necessary, ensuring valid syntax.\n"
        "- Do not remove details; add concise clarifications only when they address a review concern.\n"
        "- Return ONLY the refined Markdown. Do not include analysis, rationale, or extra commentary."
    )
    user_prompt = (
        f"Context:\nTitle: {title}\nRepository: {repo}\nIssue: #{issue_number}\n\n"
        f"Original Markdown (to refine as README.md):\n\n{issue_body}\n\n"
        f"Shark Review Comments (harsh + constructive):\n\n{reviews_block}\n\n"
        "Task:\n"
        "Improve the original Markdown so it addresses concerns and leans into opportunities from the reviews, "
        "without changing the core idea or its structure. Preserve ToC, headings, tables, and mermaid blocks. "
        "Ensure the output is a complete, production-ready README.md."
    )

    # Try OpenAI first (GPT-5/GPT-4.1), then fallback to Anthropic Claude Opus
    # OpenAI message format
    oa_messages = [
        { 'role': 'system', 'content': system },
        { 'role': 'user', 'content': user_prompt },
    ]
    try:
        oa_resp = _openai_chat(oa_messages, model=OPENAI_MODEL)
        refined = ''
        if oa_resp and oa_resp.get('choices'):
            refined = oa_resp['choices'][0]['message'].get('content') or ''
        if not refined:
            raise RuntimeError('empty_openai_response')
        return json_response(200, { 'refined_markdown': refined })
    except Exception:
        # Fallback to Anthropic messages format
        try:
            an_resp = _anthropic_claude([
                { 'role': 'system', 'content': system },
                { 'role': 'user', 'content': user_prompt }
            ])
            content = an_resp.get('content') or []
            refined = ''
            if isinstance(content, list) and content:
                refined = content[0].get('text') or ''
            elif isinstance(content, str):
                refined = content
            if not refined:
                refined = issue_body
            return json_response(200, { 'refined_markdown': refined })
        except Exception as e2:
            # Final fallback: return original
            return json_response(200, { 'refined_markdown': issue_body, 'note': 'fallback', 'detail': str(e2) })
