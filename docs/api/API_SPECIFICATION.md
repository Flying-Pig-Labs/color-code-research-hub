# 🦈 Shark Swarm Leaderboard API Specification

## Base URL
```
https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod
```

## Authentication
All endpoints are currently public (CORS enabled). Future versions may require API keys.

## Endpoints

### 1. Get Leaderboard
Retrieves the top 10 ideas ranked by Shark Score across all repositories.

**Endpoint:** `GET /leaderboard`

**Response:** `200 OK`
```json
{
  "success": true,
  "ideas": [
    {
      "rank": 1,
      "id": "ocean-studio-repos/surge-blaze-core#8",
      "repository": "ocean-studio-repos/surge-blaze-core",
      "issue_number": 8,
      "title": "AI-Powered Medical Diagnosis Platform",
      "description": "Revolutionary healthcare AI that reduces misdiagnosis by 40% using advanced...",
      "score": 94,
      "investment_total": 2500000,
      "investment_display": "$2.5M",
      "github_url": "https://github.com/ocean-studio-repos/surge-blaze-core/issues/8",
      "labels": [
        {
          "name": "shark ready 🦈",
          "color": "0075ca"
        }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "reviewed_at": "2024-01-15T14:45:00Z",
      "has_king_label": false,
      "state": "open",
      "medal": "🥇"
    },
    {
      "rank": 2,
      "id": "ocean-studio-repos/quantum-crypto#12",
      "repository": "ocean-studio-repos/quantum-crypto",
      "issue_number": 12,
      "title": "Quantum Computing SaaS for Crypto",
      "description": "Next-generation encryption platform that leverages quantum computing to...",
      "score": 87,
      "investment_total": 1800000,
      "investment_display": "$1.8M",
      "github_url": "https://github.com/ocean-studio-repos/quantum-crypto/issues/12",
      "labels": [],
      "created_at": "2024-01-14T09:15:00Z",
      "reviewed_at": "2024-01-14T16:20:00Z",
      "has_king_label": false,
      "state": "open",
      "medal": "🥈"
    }
    // ... up to 10 items
  ],
  "generated_at": "2024-01-15T18:30:00Z"
}
```

**Field Descriptions:**
- `rank`: Position in leaderboard (1-10)
- `id`: Unique identifier combining repo and issue number
- `repository`: Full GitHub repository path
- `issue_number`: GitHub issue number
- `title`: Issue title (the idea name)
- `description`: Truncated description (~50 words)
- `score`: Shark Score (0-100)
- `investment_total`: Total investment amount in dollars
- `investment_display`: Formatted investment string (e.g., "$2.5M", "$500K")
- `github_url`: Direct link to GitHub issue
- `labels`: Array of GitHub labels on the issue
- `has_king_label`: Boolean indicating if issue has "👑 king" label
- `state`: Issue state ("open" or "closed")
- `medal`: Emoji medal for top 3 ("🥇", "🥈", "🥉", or empty string)

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

---

### 2. Build Repository
Creates a new repository in the `ocean-studio-apps` organization from a selected idea.

**Endpoint:** `POST /build`

**Request Body:**
```json
{
  "repository": "ocean-studio-repos/surge-blaze-core",
  "issue_number": 8,
  "title": "AI-Powered Medical Diagnosis Platform",
  "score": 94,
  "investment_display": "$2.5M",
  "rank": 1,
  "medal": "🥇"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "repo_url": "https://github.com/ocean-studio-apps/ai-powered-medical-diagnosis-platform-20240115",
  "repo_name": "ai-powered-medical-diagnosis-platform-20240115",
  "message": "Successfully created ai-powered-medical-diagnosis-platform-20240115"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Repository already exists or insufficient permissions"
}
```

**What This Endpoint Does:**
1. Creates a new repository in `ocean-studio-apps` organization
2. Generates a README with the original pitch and shark reviews
3. Sets up basic project structure (src/, tests/, docs/, .github/workflows/)
4. Adds a "🏗️ built" label to the original issue
5. Returns the new repository URL

---

### 3. Award King Label (Future Implementation)
Awards the "👑 king" label to the highest-scoring issue.

**Endpoint:** `POST /award-king`

**Request Body:**
```json
{
  "repository": "ocean-studio-repos/surge-blaze-core",
  "issue_number": 8
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "King label awarded to issue #8"
}
```

---

## Data Models

### Shark Score Calculation
The Shark Score is a composite metric (0-100) calculated as:
- **40%** - Investment decision ratio (yes votes / total sharks)
- **30%** - Average confidence score (1-5 scale normalized)
- **30%** - Total investment size (capped at $1M for maximum points)

### Score Interpretation
- **80-100**: 🔥 HOT DEAL! Multiple sharks fighting for this
- **60-79**: ✅ Strong Interest - Solid investment opportunity
- **40-59**: 🤔 Mixed Reception - Needs refinement
- **20-39**: ⚠️ Limited Interest - Major pivots needed
- **0-19**: ❌ No Deal - Back to the drawing board

### Investment Display Format
- Values ≥ $1M: `"$X.XM"` (e.g., "$2.5M")
- Values ≥ $1K: `"$XXXK"` (e.g., "$500K")
- Values < $1K: `"$XXX"` (e.g., "$500")

---

## DynamoDB Schema

### Table: EnhancedSharkReviewsTable
**Primary Key:** 
- Partition Key: `issue_id` (String) - Format: "issue-{number}"
- Sort Key: `review_timestamp` (String) - ISO 8601 format

**Attributes:**
```typescript
{
  issue_id: string;           // "issue-8"
  review_timestamp: string;   // "2024-01-15T14:45:00Z"
  shark_name: string;         // "Kevin O'Leary" or "SHARK_SCORE_SUMMARY"
  repository: string;         // "ocean-studio-repos/surge-blaze-core"
  review_content: string;     // Full review text
  confidence_score: number;   // 1-5
  decision: string;          // "yes" | "no" | "summary"
  investment_offer: string;   // "$500K for 10%"
  investment_amount: number;  // 500000
  equity_percentage: number;  // 10
  total_score: number;       // 0-100 (Shark Score for summaries)
  rubric_scores: object;     // Detailed scoring breakdown
  exa_insights_used: boolean; // Whether market data was used
}
```

**Special Records:**
- Records with `shark_name = "SHARK_SCORE_SUMMARY"` contain the aggregated Shark Score
- These summary records are what the leaderboard queries

---

## Frontend Implementation Guide

### Recommended UI Components

1. **Leaderboard Table**
   - Sortable columns
   - Medal badges for top 3
   - Color-coded score indicators
   - Hover effects for rows
   - Click-to-expand for full description

2. **BUILD Button States**
   - Default: Blue gradient with hammer icon
   - Hover: Scale up slightly, darker gradient
   - Loading: Spinning indicator, disabled state
   - Success: Green flash animation
   - Error: Red shake animation

3. **Auto-Refresh**
   - Poll `/leaderboard` every 30 seconds
   - Show subtle refresh indicator
   - Preserve user interactions during refresh

4. **Score Visualization**
   - Circular progress indicator
   - Color gradients based on score ranges
   - Animated transitions when scores update

### Error Handling
- Network errors: Show retry button
- Build failures: Display error message with details
- Empty leaderboard: Show placeholder message

### Performance Considerations
- Cache leaderboard data locally for 30 seconds
- Debounce BUILD button clicks
- Lazy load full descriptions
- Virtualize table for large datasets (future)

---

## CORS Configuration
All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

---

## Rate Limits
- Leaderboard GET: No limit (cached at CloudFront)
- Build POST: 10 requests per minute per IP
- Award King POST: 1 request per hour

---

## Testing Endpoints

### Test Leaderboard
```bash
curl https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/leaderboard
```

### Test Build
```bash
curl -X POST https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/build \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "ocean-studio-repos/test-repo",
    "issue_number": 1,
    "title": "Test Idea",
    "score": 85,
    "investment_display": "$1M",
    "rank": 1,
    "medal": "🥇"
  }'
```

---

## Future Enhancements
1. **WebSocket Support** - Real-time score updates
2. **Filtering** - By date range, repository, score threshold
3. **Historical Data** - Score trends over time
4. **Comparison View** - Side-by-side idea comparison
5. **Export** - CSV/JSON export of leaderboard data
6. **Notifications** - Alert when new ideas reach top 3
7. **Authentication** - Secure BUILD operations with API keys