# EC2 Integration Flow Diagram

## Complete Data Flow Architecture

```mermaid
flowchart TB
    subgraph "Frontend Layer"
        UI[React UI Forms]
        FC[Form Configuration<br/>JSON]
        UI --> FC
    end

    subgraph "Local Backend Layer"
        API[Node.js API Server<br/>:3001]
        FP[Form Data Processor]
        JQ[Job Queue<br/>In-Memory]
        API --> FP
        API --> JQ
    end

    subgraph "EC2 Infrastructure"
        WH[Webhook Server<br/>:3000]
        NG[Nginx Proxy<br/>:80]
        SE[Shell Executor<br/>remote-swarm-executor.sh]
        NG --> WH
        WH --> SE
    end

    subgraph "AWS Services"
        SM[AWS Secrets Manager<br/>API Keys & Tokens]
        IAM[IAM Instance Profile]
        SM --> IAM
    end

    subgraph "Claude Flow Swarm"
        SI[Swarm Init]
        AG[Agent Spawning]
        TE[Task Execution]
        SI --> AG
        AG --> TE
    end

    subgraph "Output Layer"
        GH[GitHub Repository<br/>Private Repos]
        RP[Research Reports<br/>JSON + Markdown]
        TE --> RP
        RP --> GH
    end

    UI -->|POST /research/submit| API
    API -->|HTTP POST| NG
    SE -->|npx claude-flow| SI
    IAM -->|Credentials| SE
    WH -->|Job Status| API
    API -->|Poll Status| UI
    GH -->|Repository URL| UI

    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef ec2 fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef aws fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef swarm fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef output fill:#f5f5f5,stroke:#424242,stroke-width:2px

    class UI,FC frontend
    class API,FP,JQ backend
    class WH,NG,SE ec2
    class SM,IAM aws
    class SI,AG,TE swarm
    class GH,RP output
```

## Form Submission Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend Form
    participant L as Local Backend
    participant E as EC2 Webhook
    participant S as Swarm Executor
    participant C as Claude Flow
    participant G as GitHub

    U->>F: Fill form & submit
    F->>F: Validate inputs
    F->>L: POST /research/submit
    L->>L: Generate Job ID
    L->>L: Process form data
    L->>E: POST /webhook/research
    E->>E: Queue job
    E-->>L: Return job ID
    L-->>F: Return job ID
    F->>U: Show "Processing..."
    
    Note over E,S: Async Processing
    E->>S: Spawn shell script
    S->>S: Validate environment
    S->>C: Initialize swarm
    C->>C: Spawn agents
    C->>C: Execute tasks
    C->>S: Return results
    S->>S: Compile report
    S->>G: Create repository
    S->>E: Update job status
    
    loop Poll Status
        F->>L: GET /status/:jobId
        L->>E: Check status
        E-->>L: Return status
        L-->>F: Update UI
    end
    
    F->>L: GET /report/:jobId
    L->>E: Get results
    E-->>L: Return report
    L-->>F: Display results
    F->>U: Show report + GitHub link
```

## Agent Spawning Logic by Team Type

```mermaid
flowchart LR
    subgraph "Red Team Agents"
        R1[Market Researcher]
        R2[Disruption Analyst]
        R3[Competitor Tracker]
        R4[Financial Analyst]
        R5[Trend Spotter]
        R6[Strategist]
        RG{Global Scope?}
        R7[Geographic Analyst]
        RG -->|Yes +2 agents| R7
    end

    subgraph "Black Team Agents"
        B1[Tech Detective]
        B2[Patent Analyst]
        B3[Code Archaeologist]
        BT{Tool Categories}
        B4[Data Engineer]
        B5[ML Researcher]
        BT -->|data_infrastructure| B4
        BT -->|ml_ai| B5
    end

    subgraph "White Team Agents"
        W1[Opportunity Hunter]
        W2[Market Validator]
        W3[Innovation Catalyst]
        WT{Opportunity Types}
        W4[Integration Scout]
        W5[Workflow Analyst]
        W6[Vertical Expert]
        WT -->|integration_gaps| W4
        WT -->|workflow_automation| W5
        WT -->|vertical_solutions| W6
    end
```

## Security Flow

```mermaid
flowchart TB
    subgraph "Security Layers"
        L1[Frontend Validation]
        L2[API Key Check]
        L3[Webhook Signature]
        L4[IAM Role]
        L5[Secrets Manager]
        
        L1 -->|Input Sanitization| L2
        L2 -->|X-API-Key Header| L3
        L3 -->|HMAC-SHA256| L4
        L4 -->|AssumeRole| L5
        L5 -->|GetSecretValue| K[API Keys]
    end

    subgraph "Token Flow"
        GH[GitHub Token]
        CL[Claude API Key]
        K --> GH
        K --> CL
    end
```

## Data Transformation Pipeline

```mermaid
flowchart LR
    subgraph "Input"
        FD[Form Data<br/>User Input]
    end

    subgraph "Processing"
        FP[Form Processor]
        TC[Template Config]
        DP[Dynamic Prompts]
        GW[Grading Weights]
        SP[Swarm Parameters]
        
        FD --> FP
        TC --> FP
        FP --> DP
        FP --> GW
        FP --> SP
    end

    subgraph "Configuration"
        SC[Swarm Config<br/>JSON]
        DP --> SC
        GW --> SC
        SP --> SC
    end

    subgraph "Execution"
        CF[Claude Flow<br/>Swarm]
        SC --> CF
    end

    subgraph "Output"
        RR[Research Results]
        GR[GitHub Repo]
        CF --> RR
        RR --> GR
    end
```

## Resource Lifecycle

```mermaid
stateDiagram-v2
    [*] --> FormSubmission: User submits
    FormSubmission --> JobCreated: Generate UUID
    JobCreated --> Processing: Spawn executor
    Processing --> SwarmActive: Initialize agents
    SwarmActive --> TasksRunning: Execute research
    TasksRunning --> ResultsCompiled: Complete tasks
    ResultsCompiled --> GitHubCreated: Push to repo
    GitHubCreated --> JobComplete: Update status
    JobComplete --> Cleanup: After 24h
    Cleanup --> [*]: Remove temp files

    Processing --> Failed: Error occurs
    Failed --> Cleanup: Log error
```

## Performance Optimization Flow

```mermaid
flowchart TB
    subgraph "Parallel Operations"
        P1[Agent Spawn 1]
        P2[Agent Spawn 2]
        P3[Agent Spawn 3]
        P4[Agent Spawn N]
        
        I[Initialize] --> P1
        I --> P2
        I --> P3
        I --> P4
    end

    subgraph "Task Distribution"
        T1[Task Queue]
        T2[Agent Pool]
        T3[Load Balancer]
        
        P1 --> T2
        P2 --> T2
        P3 --> T2
        P4 --> T2
        T1 --> T3
        T3 --> T2
    end

    subgraph "Result Aggregation"
        R1[Partial Results]
        R2[Memory Store]
        R3[Final Report]
        
        T2 --> R1
        R1 --> R2
        R2 --> R3
    end
```

## Error Handling & Recovery

```mermaid
flowchart TB
    E[Error Detected]
    
    E --> T{Error Type?}
    
    T -->|Network| N[Retry with Backoff]
    T -->|API Limit| L[Queue & Wait]
    T -->|Invalid Data| D[Return Error]
    T -->|System| S[Alert & Failover]
    
    N --> R{Retry Count}
    R -->|< 3| N
    R -->|>= 3| F[Mark Failed]
    
    L --> W[Wait Period]
    W --> RT[Retry Task]
    
    D --> U[Update UI]
    S --> A[Send Alert]
    
    F --> LOG[Log Details]
    A --> LOG
    U --> LOG
```

## Monitoring Dashboard Components

```mermaid
flowchart LR
    subgraph "Real-time Metrics"
        M1[Active Jobs]
        M2[Agent Status]
        M3[Task Progress]
        M4[API Usage]
    end

    subgraph "Historical Data"
        H1[Success Rate]
        H2[Avg Duration]
        H3[Token Usage]
        H4[Error Rate]
    end

    subgraph "Business Analytics"
        B1[Top Companies]
        B2[Team Usage]
        B3[Focus Areas]
        B4[ROI Metrics]
    end

    M1 --> D[Dashboard]
    M2 --> D
    M3 --> D
    M4 --> D
    H1 --> D
    H2 --> D
    H3 --> D
    H4 --> D
    B1 --> D
    B2 --> D
    B3 --> D
    B4 --> D
```