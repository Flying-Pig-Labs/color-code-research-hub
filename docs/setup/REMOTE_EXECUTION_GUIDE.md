# Remote Swarm Execution Guide

## Overview

The `remote-swarm-executor.sh` script enables remote execution of competitive intelligence swarms with full customization, progress monitoring, and GitHub integration.

## Prerequisites

1. **System Requirements:**
   - Node.js 16+ 
   - npm
   - git
   - jq (JSON processor)
   - curl

2. **Claude Flow:**
   - Claude Flow CLI installed or accessible via npx
   - Valid Claude API key set as `CLAUDE_API_KEY`

3. **Optional GitHub Integration:**
   - GitHub organization access
   - Personal access token with repo creation permissions

## Quick Start

### Basic Usage

```bash
# Simple analysis with company name only
./remote-swarm-executor.sh --team red --company "Salesforce"

# Using a configuration file
./remote-swarm-executor.sh --team black --config sample-configs/black-team-config.json

# With GitHub repository creation
GITHUB_ORG=myorg GITHUB_TOKEN=ghp_xxx ./remote-swarm-executor.sh \
  --team white --company "Slack" --github
```

### Environment Variables

```bash
# Required
export CLAUDE_API_KEY="your-claude-api-key"

# Optional - for GitHub integration
export GITHUB_ORG="your-github-org"
export GITHUB_TOKEN="your-github-token"

# Optional - for notifications
export WEBHOOK_URL="https://your-webhook-endpoint.com"
```

## Command Line Options

| Option | Description | Required | Example |
|--------|-------------|----------|---------|
| `--team` | Team type (red/black/white) | Yes | `--team red` |
| `--config` | Configuration file path | No* | `--config config.json` |
| `--company` | Company name (if no config) | No* | `--company "Microsoft"` |
| `--output` | Output directory | No | `--output ./results` |
| `--github` | Create GitHub repository | No | `--github` |
| `--notify` | Send webhook notifications | No | `--notify` |

*Either `--config` or `--company` is required

## Configuration Files

Configuration files allow full customization of the analysis. See the `sample-configs/` directory for examples.

### Red Team Configuration Example

```json
{
  "companyName": "Salesforce",
  "teamType": "red",
  "analysisFocus": ["revenue_unbundling", "feature_extraction"],
  "marketScope": "global",
  "disruptionTimeline": 6,
  "investmentRange": ["small", "medium"],
  "competitiveIntensity": "low_competition"
}
```

## Output Structure

The script creates an organized output directory:

```
ci-output-20240120-143022/
├── swarm-config.json           # Processed configuration
├── research-tasks.json         # Task definitions
├── research-results.json       # Raw research data
├── competitive-intelligence-report.json  # Full JSON report
└── report.md                   # Markdown summary report
```

## GitHub Repository Structure

When `--github` is enabled, results are organized as:

```
ci-red-salesforce-20240120/
├── README.md                   # Executive summary report
├── data/                       # Raw data and configurations
│   ├── swarm-config.json
│   └── research-*.json
├── analysis/                   # Processed analysis
│   └── competitive-intelligence-report.json
└── recommendations/            # Next steps and actions
    └── next-steps.md
```

## Monitoring Execution

The script provides real-time monitoring:

1. **Progress Indicators:** Shows current operation status
2. **Agent Activity:** Displays active agent count
3. **Task Progress:** Shows completed vs total tasks
4. **Time Tracking:** Monitors execution duration

## Advanced Features

### Custom Agent Configuration

The script automatically adjusts agent count and types based on:
- Selected focus areas
- Tool categories
- Opportunity types
- Complexity settings

### Dynamic Prompt Generation

Prompts are dynamically generated based on form selections:
- Focus-specific research questions
- Customized search parameters
- Adjusted grading criteria

### Intelligent Grading

Results are graded using weighted rubrics that adjust based on:
- Risk tolerance
- Success metrics priority
- Evidence thresholds
- Market preferences

## Troubleshooting

### Common Issues

1. **"Claude Flow is not accessible"**
   - Ensure `npx claude-flow@alpha` works
   - Check npm registry access

2. **"Invalid GitHub token"**
   - Verify token has repo creation permissions
   - Check organization access

3. **"Failed to process configuration"**
   - Ensure form-data-processor.js is in the same directory
   - Validate JSON syntax in config file

### Debug Mode

Enable debug output:
```bash
export DEBUG=1
./remote-swarm-executor.sh --team red --company "Example Corp"
```

## Security Considerations

1. **API Keys:** Never commit API keys to version control
2. **GitHub Tokens:** Use tokens with minimal required permissions
3. **Private Repos:** The script creates private repositories by default
4. **Sensitive Data:** Review reports before sharing

## Integration Examples

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Run Competitive Intelligence
  env:
    CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    ./remote-swarm-executor.sh \
      --team ${{ inputs.team }} \
      --config ${{ inputs.config }} \
      --github --notify
```

### Scheduled Analysis

```bash
# Cron job for weekly analysis
0 9 * * 1 /path/to/remote-swarm-executor.sh \
  --team white \
  --company "Target Market" \
  --output /var/reports/ci-weekly \
  --github
```

## Performance Tips

1. **Parallel Execution:** The script spawns agents in parallel for speed
2. **Memory Usage:** Large analyses may require 4GB+ RAM
3. **Network:** Stable internet connection required for API calls
4. **Storage:** Each analysis typically uses 10-50MB

## Support

- **Documentation:** See repository README
- **Issues:** File on GitHub
- **Examples:** Check `sample-configs/` directory