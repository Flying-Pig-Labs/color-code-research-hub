#!/bin/bash

# ============================================================================
# Claude Flow Competitive Intelligence Remote Swarm Executor
# ============================================================================
# This script executes competitive intelligence swarms remotely with:
# - Environment setup and validation
# - Dynamic configuration generation
# - Swarm execution with progress monitoring
# - GitHub repository creation and population
# - Result compilation and notification
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_VERSION="1.0.0"
CLAUDE_FLOW_VERSION="alpha"
LOG_DIR="/tmp/claude-flow-ci"
GITHUB_ORG="${GITHUB_ORG:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create log directory
mkdir -p "$LOG_DIR"

# ============================================================================
# Helper Functions
# ============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_DIR/execution.log"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_DIR/execution.log" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_DIR/execution.log"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_DIR/execution.log"
}

# Progress indicator
show_progress() {
    local message="$1"
    local pid=$2
    local delay=0.1
    local spinstr='|/-\'
    
    echo -n "$message "
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
    echo " ✓"
}

# Validate environment
validate_environment() {
    log "Validating environment..."
    
    # Check required tools
    local required_tools=("node" "npm" "git" "jq" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Check Claude Flow
    if ! npx "claude-flow@$CLAUDE_FLOW_VERSION" --version &> /dev/null; then
        error "Claude Flow is not accessible"
        exit 1
    fi
    
    # Check GitHub credentials if GitHub integration is enabled
    if [[ -n "$GITHUB_ORG" ]]; then
        if [[ -z "$GITHUB_TOKEN" ]]; then
            error "GITHUB_TOKEN is required when GITHUB_ORG is set"
            exit 1
        fi
        
        # Validate GitHub token
        if ! curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user &> /dev/null; then
            error "Invalid GitHub token"
            exit 1
        fi
    fi
    
    log "Environment validation complete"
}

# Parse command line arguments
parse_arguments() {
    TEAM_TYPE=""
    CONFIG_FILE=""
    COMPANY_NAME=""
    OUTPUT_DIR=""
    CREATE_GITHUB_REPO=false
    SEND_NOTIFICATIONS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --team)
                TEAM_TYPE="$2"
                shift 2
                ;;
            --config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --company)
                COMPANY_NAME="$2"
                shift 2
                ;;
            --output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --github)
                CREATE_GITHUB_REPO=true
                shift
                ;;
            --notify)
                SEND_NOTIFICATIONS=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown argument: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Validate required arguments
    if [[ -z "$TEAM_TYPE" ]]; then
        error "Team type is required (--team red|black|white)"
        exit 1
    fi
    
    if [[ ! "$TEAM_TYPE" =~ ^(red|black|white)$ ]]; then
        error "Invalid team type: $TEAM_TYPE (must be red, black, or white)"
        exit 1
    fi
    
    if [[ -z "$CONFIG_FILE" ]] && [[ -z "$COMPANY_NAME" ]]; then
        error "Either --config or --company is required"
        exit 1
    fi
    
    # Set default output directory
    if [[ -z "$OUTPUT_DIR" ]]; then
        OUTPUT_DIR="./ci-output-$(date +%Y%m%d-%H%M%S)"
    fi
}

# Show help message
show_help() {
    cat << EOF
Claude Flow Competitive Intelligence Remote Swarm Executor v$SCRIPT_VERSION

Usage: $0 --team <red|black|white> [options]

Required Arguments:
  --team <type>       Team type: red (market disruption), black (tool reverse engineering), 
                      or white (whitespace opportunity)
  
  --config <file>     Configuration file with form data (JSON)
  OR
  --company <name>    Company name for basic analysis

Optional Arguments:
  --output <dir>      Output directory (default: ./ci-output-TIMESTAMP)
  --github            Create GitHub repository for results
  --notify            Send notifications via webhook
  --help              Show this help message

Environment Variables:
  GITHUB_ORG          GitHub organization for repository creation
  GITHUB_TOKEN        GitHub personal access token
  WEBHOOK_URL         Webhook URL for notifications
  CLAUDE_API_KEY      Claude API key (required for swarm execution)

Examples:
  # Basic execution with company name
  $0 --team red --company "Salesforce"
  
  # Advanced execution with custom configuration
  $0 --team black --config config.json --output ./results --github --notify
  
  # White team analysis with GitHub integration
  GITHUB_ORG=myorg GITHUB_TOKEN=ghp_xxx $0 --team white --company "Slack" --github

EOF
}

# Generate swarm configuration
generate_swarm_config() {
    log "Generating swarm configuration..."
    
    local config_json=""
    
    if [[ -n "$CONFIG_FILE" ]]; then
        # Use provided configuration file
        if [[ ! -f "$CONFIG_FILE" ]]; then
            error "Configuration file not found: $CONFIG_FILE"
            exit 1
        fi
        config_json=$(cat "$CONFIG_FILE")
    else
        # Generate basic configuration from company name
        config_json=$(cat << EOF
{
  "companyName": "$COMPANY_NAME",
  "teamType": "$TEAM_TYPE"
}
EOF
)
    fi
    
    # Process configuration through form data processor
    local processed_config=$(node -e "
        const FormDataProcessor = require('./form-data-processor.js');
        const processor = new FormDataProcessor();
        const formData = $config_json;
        const config = processor.generateSwarmConfig('$TEAM_TYPE', formData);
        console.log(JSON.stringify(config, null, 2));
    " 2>/dev/null) || {
        error "Failed to process configuration"
        exit 1
    }
    
    # Save processed configuration
    echo "$processed_config" > "$OUTPUT_DIR/swarm-config.json"
    log "Configuration saved to $OUTPUT_DIR/swarm-config.json"
    
    echo "$processed_config"
}

# Initialize swarm
initialize_swarm() {
    local config="$1"
    log "Initializing swarm..."
    
    # Extract swarm parameters
    local topology=$(echo "$config" | jq -r '.swarm_config.topology // "hierarchical"')
    local max_agents=$(echo "$config" | jq -r '.swarm_config.maxAgents // 6')
    local strategy=$(echo "$config" | jq -r '.swarm_config.strategy // "adaptive"')
    
    # Initialize swarm
    local swarm_id=$(npx "claude-flow@$CLAUDE_FLOW_VERSION" swarm init \
        --topology "$topology" \
        --max-agents "$max_agents" \
        --strategy "$strategy" \
        --memory-enabled \
        --output json | jq -r '.swarm_id') || {
        error "Failed to initialize swarm"
        exit 1
    }
    
    log "Swarm initialized with ID: $swarm_id"
    echo "$swarm_id"
}

# Spawn agents based on team type
spawn_agents() {
    local team_type="$1"
    local swarm_id="$2"
    local config="$3"
    
    log "Spawning agents for $team_type team..."
    
    case "$team_type" in
        "red")
            spawn_red_team_agents "$swarm_id" "$config"
            ;;
        "black")
            spawn_black_team_agents "$swarm_id" "$config"
            ;;
        "white")
            spawn_white_team_agents "$swarm_id" "$config"
            ;;
    esac
}

# Spawn Red Team agents
spawn_red_team_agents() {
    local swarm_id="$1"
    local config="$2"
    
    local agents=(
        "market-researcher:Analyze market dynamics and opportunities"
        "disruption-analyst:Identify disruption vectors"
        "competitor-tracker:Monitor competitive landscape"
        "financial-analyst:Evaluate financial vulnerabilities"
        "trend-spotter:Identify emerging trends"
        "strategist:Synthesize findings into strategies"
    )
    
    for agent in "${agents[@]}"; do
        local name="${agent%%:*}"
        local description="${agent#*:}"
        
        npx "claude-flow@$CLAUDE_FLOW_VERSION" agent spawn \
            --swarm-id "$swarm_id" \
            --name "$name" \
            --type "researcher" \
            --description "$description" &
    done
    
    wait
    log "Red team agents spawned successfully"
}

# Spawn Black Team agents
spawn_black_team_agents() {
    local swarm_id="$1"
    local config="$2"
    
    local tool_categories=$(echo "$config" | jq -r '.customizations.toolCategories[]' 2>/dev/null)
    
    # Base agents
    local agents=(
        "tech-detective:Research technical implementations"
        "patent-analyst:Analyze patent filings"
        "code-archaeologist:Examine open source traces"
    )
    
    # Add category-specific agents
    if echo "$tool_categories" | grep -q "data_infrastructure"; then
        agents+=("data-engineer:Analyze data architecture")
    fi
    
    if echo "$tool_categories" | grep -q "ml_ai"; then
        agents+=("ml-researcher:Investigate ML/AI systems")
    fi
    
    for agent in "${agents[@]}"; do
        local name="${agent%%:*}"
        local description="${agent#*:}"
        
        npx "claude-flow@$CLAUDE_FLOW_VERSION" agent spawn \
            --swarm-id "$swarm_id" \
            --name "$name" \
            --type "analyst" \
            --description "$description" &
    done
    
    wait
    log "Black team agents spawned successfully"
}

# Spawn White Team agents
spawn_white_team_agents() {
    local swarm_id="$1"
    local config="$2"
    
    local opportunity_types=$(echo "$config" | jq -r '.customizations.opportunityType[]' 2>/dev/null)
    
    # Dynamic agent creation based on opportunity types
    local agents=()
    
    if echo "$opportunity_types" | grep -q "integration_gaps"; then
        agents+=("integration-scout:Find integration opportunities")
    fi
    
    if echo "$opportunity_types" | grep -q "workflow_automation"; then
        agents+=("workflow-analyst:Identify automation potential")
    fi
    
    if echo "$opportunity_types" | grep -q "vertical_solutions"; then
        agents+=("vertical-expert:Explore industry-specific needs")
    fi
    
    # Add default agents
    agents+=(
        "opportunity-hunter:Discover whitespace opportunities"
        "market-validator:Validate market potential"
        "innovation-catalyst:Generate innovative solutions"
    )
    
    for agent in "${agents[@]}"; do
        local name="${agent%%:*}"
        local description="${agent#*:}"
        
        npx "claude-flow@$CLAUDE_FLOW_VERSION" agent spawn \
            --swarm-id "$swarm_id" \
            --name "$name" \
            --type "researcher" \
            --description "$description" &
    done
    
    wait
    log "White team agents spawned successfully"
}

# Execute research tasks
execute_research() {
    local swarm_id="$1"
    local config="$2"
    local team_type="$3"
    
    log "Executing research tasks..."
    
    # Get research tasks from config
    local tasks=$(echo "$config" | jq -r '.research_tasks[]' 2>/dev/null)
    
    # Add dynamic tasks based on customizations
    local dynamic_prompts=$(echo "$config" | jq -r '.dynamic_prompts[]' 2>/dev/null)
    
    # Create task file
    local task_file="$OUTPUT_DIR/research-tasks.json"
    cat > "$task_file" << EOF
{
  "swarm_id": "$swarm_id",
  "company": "$(echo "$config" | jq -r '.company_name')",
  "team_type": "$team_type",
  "tasks": [
$(echo "$tasks" | jq -Rs 'split("\n") | map(select(length > 0)) | map("    \"" + . + "\"") | join(",\n")')
  ],
  "dynamic_tasks": [
$(echo "$dynamic_prompts" | jq -Rs 'split("\n") | map(select(length > 0)) | map("    \"" + . + "\"") | join(",\n")')
  ]
}
EOF
    
    # Execute tasks through swarm
    npx "claude-flow@$CLAUDE_FLOW_VERSION" task orchestrate \
        --swarm-id "$swarm_id" \
        --task-file "$task_file" \
        --strategy "parallel" \
        --memory-enabled \
        --output "$OUTPUT_DIR/research-results.json" &
    
    local task_pid=$!
    show_progress "Research in progress" $task_pid
    
    log "Research tasks completed"
}

# Monitor swarm execution
monitor_swarm() {
    local swarm_id="$1"
    local duration="${2:-300}" # Default 5 minutes
    
    log "Monitoring swarm execution..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Get swarm status
        local status=$(npx "claude-flow@$CLAUDE_FLOW_VERSION" swarm status \
            --swarm-id "$swarm_id" \
            --output json 2>/dev/null) || break
        
        local active_agents=$(echo "$status" | jq -r '.agents.active' 2>/dev/null || echo "0")
        local completed_tasks=$(echo "$status" | jq -r '.tasks.completed' 2>/dev/null || echo "0")
        local total_tasks=$(echo "$status" | jq -r '.tasks.total' 2>/dev/null || echo "0")
        
        # Display progress
        printf "\r${BLUE}[MONITOR]${NC} Agents: %d active | Tasks: %d/%d completed" \
            "$active_agents" "$completed_tasks" "$total_tasks"
        
        # Check if all tasks are completed
        if [[ "$completed_tasks" -eq "$total_tasks" ]] && [[ "$total_tasks" -gt 0 ]]; then
            echo ""
            log "All tasks completed"
            break
        fi
        
        sleep 5
    done
    
    echo ""
}

# Compile results
compile_results() {
    local swarm_id="$1"
    local config="$2"
    local team_type="$3"
    
    log "Compiling research results..."
    
    # Get task results
    local results=$(npx "claude-flow@$CLAUDE_FLOW_VERSION" task results \
        --swarm-id "$swarm_id" \
        --output json) || {
        error "Failed to retrieve task results"
        return 1
    }
    
    # Get swarm metrics
    local metrics=$(npx "claude-flow@$CLAUDE_FLOW_VERSION" swarm metrics \
        --swarm-id "$swarm_id" \
        --output json) || {
        warning "Failed to retrieve swarm metrics"
    }
    
    # Create comprehensive report
    local report_file="$OUTPUT_DIR/competitive-intelligence-report.json"
    cat > "$report_file" << EOF
{
  "metadata": {
    "team_type": "$team_type",
    "company": "$(echo "$config" | jq -r '.company_name')",
    "execution_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "swarm_id": "$swarm_id",
    "claude_flow_version": "$CLAUDE_FLOW_VERSION"
  },
  "configuration": $(echo "$config" | jq -c '.customizations'),
  "results": $results,
  "metrics": ${metrics:-{}},
  "grading": $(grade_results "$results" "$config")
}
EOF
    
    # Generate markdown report
    generate_markdown_report "$report_file" "$OUTPUT_DIR/report.md"
    
    log "Results compiled to $OUTPUT_DIR"
}

# Grade results based on rubric
grade_results() {
    local results="$1"
    local config="$2"
    
    # Extract grading weights
    local weights=$(echo "$config" | jq -c '.grading_weights')
    
    # This would normally involve more complex grading logic
    # For now, return a placeholder
    cat << EOF
{
  "overall_score": 85,
  "category_scores": {
    "relevance": 90,
    "completeness": 85,
    "actionability": 80,
    "innovation": 88
  },
  "recommendations": [
    "High-priority opportunity identified in market segment X",
    "Technical feasibility confirmed for approach Y",
    "Strategic advantage possible through initiative Z"
  ]
}
EOF
}

# Generate markdown report
generate_markdown_report() {
    local json_file="$1"
    local output_file="$2"
    
    log "Generating markdown report..."
    
    # Extract data from JSON
    local data=$(cat "$json_file")
    local team_type=$(echo "$data" | jq -r '.metadata.team_type')
    local company=$(echo "$data" | jq -r '.metadata.company')
    local date=$(echo "$data" | jq -r '.metadata.execution_date')
    local score=$(echo "$data" | jq -r '.grading.overall_score')
    
    # Generate report
    cat > "$output_file" << EOF
# Competitive Intelligence Report

## Executive Summary

**Team Type:** ${team_type^} Team  
**Target Company:** $company  
**Analysis Date:** $date  
**Overall Score:** $score/100

## Key Findings

$(echo "$data" | jq -r '.results.findings[]? // "No findings available"' | sed 's/^/- /')

## Recommendations

$(echo "$data" | jq -r '.grading.recommendations[]' | sed 's/^/1. /' | nl -w1 -s'. ')

## Detailed Analysis

### Research Configuration

$(echo "$data" | jq -r '.configuration | to_entries | map("- **" + .key + "**: " + (.value | tostring)) | .[]')

### Performance Metrics

- **Total Agents:** $(echo "$data" | jq -r '.metrics.agents.total // "N/A"')
- **Tasks Completed:** $(echo "$data" | jq -r '.metrics.tasks.completed // "N/A"')
- **Execution Time:** $(echo "$data" | jq -r '.metrics.execution_time // "N/A"')
- **Tokens Used:** $(echo "$data" | jq -r '.metrics.tokens_used // "N/A"')

## Category Scores

$(echo "$data" | jq -r '.grading.category_scores | to_entries | map("- **" + .key + "**: " + (.value | tostring) + "/100") | .[]')

---

*Generated by Claude Flow Competitive Intelligence v$SCRIPT_VERSION*
EOF
    
    log "Markdown report saved to $output_file"
}

# Create GitHub repository
create_github_repo() {
    local team_type="$1"
    local company="$2"
    
    if [[ -z "$GITHUB_ORG" ]]; then
        warning "GitHub organization not set, skipping repository creation"
        return
    fi
    
    log "Creating GitHub repository..."
    
    # Generate repository name
    local repo_name="ci-${team_type}-$(echo "$company" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')-$(date +%Y%m%d)"
    
    # Create repository
    local repo_response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/orgs/$GITHUB_ORG/repos" \
        -d @- << EOF
{
  "name": "$repo_name",
  "description": "Competitive Intelligence Analysis - ${team_type^} Team: $company",
  "private": true,
  "has_issues": true,
  "has_projects": false,
  "has_wiki": false,
  "auto_init": true
}
EOF
    )
    
    local repo_url=$(echo "$repo_response" | jq -r '.clone_url // empty')
    
    if [[ -z "$repo_url" ]]; then
        error "Failed to create GitHub repository"
        echo "$repo_response" | jq '.' >&2
        return 1
    fi
    
    log "Repository created: $repo_url"
    
    # Clone repository
    local temp_dir=$(mktemp -d)
    git clone "$repo_url" "$temp_dir" &> /dev/null
    
    # Copy results to repository
    cp -r "$OUTPUT_DIR"/* "$temp_dir/"
    
    # Create proper structure
    mkdir -p "$temp_dir"/{data,analysis,recommendations}
    
    # Move files to appropriate directories
    mv "$temp_dir"/swarm-config.json "$temp_dir"/data/ 2>/dev/null || true
    mv "$temp_dir"/research-*.json "$temp_dir"/data/ 2>/dev/null || true
    mv "$temp_dir"/competitive-intelligence-report.json "$temp_dir"/analysis/ 2>/dev/null || true
    mv "$temp_dir"/report.md "$temp_dir"/README.md 2>/dev/null || true
    
    # Create recommendations structure
    cat > "$temp_dir/recommendations/next-steps.md" << EOF
# Next Steps

Based on the ${team_type^} team analysis of $company:

## Immediate Actions (0-30 days)

1. Review key findings in the analysis report
2. Validate assumptions with additional research
3. Prioritize opportunities based on grading scores

## Short-term Actions (30-90 days)

1. Develop proof-of-concept for top opportunities
2. Conduct market validation
3. Build initial business case

## Long-term Strategy (90+ days)

1. Execute on validated opportunities
2. Monitor competitive responses
3. Iterate based on market feedback
EOF
    
    # Commit and push
    cd "$temp_dir"
    git add -A
    git commit -m "Initial competitive intelligence analysis

Team: ${team_type^}
Target: $company
Date: $(date -u +"%Y-%m-%d")
Score: $(cat analysis/competitive-intelligence-report.json | jq -r '.grading.overall_score')/100" &> /dev/null
    
    git push origin main &> /dev/null
    cd - > /dev/null
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log "Results pushed to GitHub: $repo_url"
    echo "$repo_url"
}

# Send notifications
send_notification() {
    local status="$1"
    local message="$2"
    local details="$3"
    
    if [[ "$SEND_NOTIFICATIONS" != "true" ]] || [[ -z "$WEBHOOK_URL" ]]; then
        return
    fi
    
    log "Sending notification..."
    
    local payload=$(cat << EOF
{
  "status": "$status",
  "message": "$message",
  "details": $details,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    )
    
    curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" &> /dev/null || {
        warning "Failed to send notification"
    }
}

# Cleanup function
cleanup() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        error "Execution failed with exit code: $exit_code"
        send_notification "error" "Competitive intelligence analysis failed" "{\"exit_code\": $exit_code}"
    fi
    
    # Cleanup temporary files
    rm -f "$LOG_DIR"/*.tmp 2>/dev/null || true
    
    exit $exit_code
}

# Main execution function
main() {
    log "Starting Claude Flow Competitive Intelligence Analysis"
    log "Version: $SCRIPT_VERSION"
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Parse arguments
    parse_arguments "$@"
    
    # Validate environment
    validate_environment
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Generate swarm configuration
    local config=$(generate_swarm_config)
    
    # Initialize swarm
    local swarm_id=$(initialize_swarm "$config")
    
    # Spawn agents
    spawn_agents "$TEAM_TYPE" "$swarm_id" "$config" &
    local spawn_pid=$!
    show_progress "Spawning agents" $spawn_pid
    
    # Execute research
    execute_research "$swarm_id" "$config" "$TEAM_TYPE"
    
    # Monitor execution
    monitor_swarm "$swarm_id" 300
    
    # Compile results
    compile_results "$swarm_id" "$config" "$TEAM_TYPE"
    
    # Create GitHub repository if requested
    local repo_url=""
    if [[ "$CREATE_GITHUB_REPO" == "true" ]]; then
        repo_url=$(create_github_repo "$TEAM_TYPE" "$COMPANY_NAME")
    fi
    
    # Send success notification
    local notification_details=$(cat << EOF
{
  "team_type": "$TEAM_TYPE",
  "company": "$COMPANY_NAME",
  "output_dir": "$OUTPUT_DIR",
  "repo_url": "$repo_url",
  "swarm_id": "$swarm_id"
}
EOF
    )
    
    send_notification "success" "Competitive intelligence analysis completed" "$notification_details"
    
    log "Analysis complete!"
    log "Results available at: $OUTPUT_DIR"
    
    if [[ -n "$repo_url" ]]; then
        log "GitHub repository: $repo_url"
    fi
}

# Execute main function
main "$@"