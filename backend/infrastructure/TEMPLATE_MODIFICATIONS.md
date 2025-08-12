# SAM Template Modifications for Report Processing

## Overview
This document specifies the exact modifications needed to `template.yaml` to support the Perplexity API report processing feature.

## Required Additions to template.yaml

### 1. New Lambda Function: ReportProcessorFunction

Add this function definition after the existing Lambda functions:

```yaml
  # Report Processor Function - Processes raw research into 5 artifacts
  ReportProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ../lambda/handlers/
      Handler: reportProcessor.handler
      Runtime: nodejs18.x
      Timeout: 900  # 15 minutes
      MemorySize: 3008  # Same as PlanOrchestrator for consistency
      ReservedConcurrencyLimit: 5  # Manage LLM API rate limits
      Environment:
        Variables:
          REPORTS_BUCKET_NAME: !Ref ResearchResultsBucket
          REPORTS_TABLE_NAME: !Ref ResearchReportsTable
          NODE_ENV: production
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObject
                - s3:PutObject
                - s3:DeleteObject
              Resource: 
                - !Sub "${ResearchResultsBucket}/*"
            - Effect: Allow
              Action:
                - dynamodb:GetItem
                - dynamodb:PutItem
                - dynamodb:UpdateItem
                - dynamodb:Query
              Resource: 
                - !GetAtt ResearchReportsTable.Arn
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource:
                - arn:aws:secretsmanager:us-east-1:984906149037:secret:anthropic_key-*
                - arn:aws:secretsmanager:us-east-1:984906149037:secret:openai_key-*
      Events:
        ProcessRawResearch:
          Type: S3
          Properties:
            Bucket: !Ref ResearchResultsBucket
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: raw/
                  - Name: suffix
                    Value: .json
      DeadLetterQueue:
        Type: SQS
        TargetArn: !GetAtt ReportProcessorDLQ.Arn
```

### 2. Dead Letter Queue for Failed Processing

Add this resource definition:

```yaml
  # Dead Letter Queue for failed report processing
  ReportProcessorDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: ReportProcessorDeadLetterQueue
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeoutSeconds: 60
      Tags:
        - Key: Application
          Value: color-code-research-hub
```

### 3. Enhanced S3 Bucket Configuration

Modify the existing `ResearchResultsBucket` to include proper folder structure and permissions:

```yaml
  # S3 Bucket for Research Results (Enhanced)
  ResearchResultsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'color-code-research-results-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldResearchResults
            Status: Enabled
            ExpirationInDays: 90
          - Id: TransitionProcessedReports
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            Filter:
              Prefix: processed/
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt ReportProcessorFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: raw/
                  - Name: suffix
                    Value: .json
      Tags:
        - Key: Application
          Value: color-code-research-hub
```

### 4. S3 Bucket Permission for Lambda

Add this permission to allow S3 to invoke the Lambda function:

```yaml
  # Permission for S3 to invoke ReportProcessor Lambda
  ReportProcessorS3Permission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt ReportProcessorFunction.Arn
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub "${ResearchResultsBucket}/*"
```

### 5. Enhanced DynamoDB Table Schema

Modify the existing `ResearchReportsTable` to include additional attributes:

```yaml
  # DynamoDB Table for Research Reports Metadata (Enhanced)
  ResearchReportsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ResearchReports
      AttributeDefinitions:
        - AttributeName: reportId
          AttributeType: S
        - AttributeName: team
          AttributeType: S
        - AttributeName: createdAt
          AttributeType: S
        - AttributeName: status
          AttributeType: S
      KeySchema:
        - AttributeName: reportId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: team-createdAt-index
          KeySchema:
            - AttributeName: team
              KeyType: HASH
            - AttributeName: createdAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: status-createdAt-index
          KeySchema:
            - AttributeName: status
              KeyType: HASH
            - AttributeName: createdAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      BillingMode: PAY_PER_REQUEST
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Application
          Value: color-code-research-hub
```

### 6. CloudWatch Log Groups

Add dedicated log groups for better monitoring:

```yaml
  # CloudWatch Log Group for Report Processor
  ReportProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${ReportProcessorFunction}"
      RetentionInDays: 30
      Tags:
        - Key: Application
          Value: color-code-research-hub
```

### 7. CloudWatch Alarms

Add monitoring alarms for the new functionality:

```yaml
  # CloudWatch Alarm for Report Processor Errors
  ReportProcessorErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ReportProcessor-ErrorRate
      AlarmDescription: Monitor error rate for report processing
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ReportProcessorFunction
      TreatMissingData: notBreaching

  # CloudWatch Alarm for Report Processor Duration
  ReportProcessorDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ReportProcessor-LongDuration
      AlarmDescription: Monitor processing duration
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 600000  # 10 minutes in milliseconds
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ReportProcessorFunction
      TreatMissingData: notBreaching
```

### 8. SNS Topic for Processing Notifications

Add SNS topic for processing completion notifications:

```yaml
  # SNS Topic for Report Processing Notifications
  ReportProcessingTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: ReportProcessingNotifications
      DisplayName: Report Processing Status Updates
      Tags:
        - Key: Application
          Value: color-code-research-hub

  # Permission for Lambda to publish to SNS
  ReportProcessorSNSPermission:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref ReportProcessingTopic
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - sns:Publish
            Resource: !Ref ReportProcessingTopic
```

### 9. Outputs Section Additions

Add these outputs to the template for easier reference:

```yaml
Outputs:
  # Existing outputs...
  
  ReportProcessorFunctionArn:
    Description: ARN of the Report Processor Lambda Function
    Value: !GetAtt ReportProcessorFunction.Arn
    Export:
      Name: !Sub "${AWS::StackName}-ReportProcessorFunctionArn"

  ResearchResultsBucketName:
    Description: Name of the S3 bucket for research results
    Value: !Ref ResearchResultsBucket
    Export:
      Name: !Sub "${AWS::StackName}-ResearchResultsBucketName"

  ReportProcessingTopicArn:
    Description: ARN of the SNS topic for processing notifications
    Value: !Ref ReportProcessingTopic
    Export:
      Name: !Sub "${AWS::StackName}-ReportProcessingTopicArn"

  ReportProcessorDLQUrl:
    Description: URL of the Dead Letter Queue for failed processing
    Value: !Ref ReportProcessorDLQ
    Export:
      Name: !Sub "${AWS::StackName}-ReportProcessorDLQUrl"
```

## Secrets Manager Integration

### Required Secrets
The system requires these secrets to be available in AWS Secrets Manager:

1. **anthropic_key** - Claude API key for primary LLM processing
2. **openai_key** - OpenAI API key for fallback processing
3. **perplexity-key** - Perplexity API key (already configured in existing researchApi.py)

### Secret Access Pattern
```javascript
// In reportProcessor.js
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

async function getSecrets() {
  const [anthropicKey, openaiKey] = await Promise.all([
    secretsManager.getSecretValue({ SecretId: 'anthropic_key' }).promise(),
    secretsManager.getSecretValue({ SecretId: 'openai_key' }).promise()
  ]);
  
  return {
    anthropicApiKey: JSON.parse(anthropicKey.SecretString).api_key,
    openaiApiKey: JSON.parse(openaiKey.SecretString).api_key
  };
}
```

## Environment Variables Configuration

The new Lambda function requires these environment variables:

```yaml
Environment:
  Variables:
    REPORTS_BUCKET_NAME: !Ref ResearchResultsBucket
    REPORTS_TABLE_NAME: !Ref ResearchReportsTable
    SNS_TOPIC_ARN: !Ref ReportProcessingTopic
    NODE_ENV: production
    AWS_REGION: !Ref AWS::Region
    PROCESSING_TIMEOUT: "840000"  # 14 minutes (buffer for 15min timeout)
```

## Deployment Sequence

1. **Update template.yaml** with all the above additions
2. **Create reportProcessor.js** handler (separate task for CODER agent)
3. **Run SAM build** to validate template changes
4. **Run SAM deploy** to deploy infrastructure updates
5. **Test S3 event triggering** with sample raw research file
6. **Verify CloudWatch logs** and monitoring setup
7. **Test end-to-end processing** pipeline

## Backward Compatibility

All changes are additive and maintain backward compatibility:
- Existing API endpoints continue to work
- Existing S3 bucket structure is preserved
- Existing DynamoDB schema is enhanced, not changed
- Existing Lambda functions are unaffected

## Cost Implications

### New Resources Cost Estimates:
- **ReportProcessorFunction**: ~$0.20 per 1GB-second execution
- **S3 Storage**: ~$0.023 per GB/month (Standard), ~$0.0125 per GB/month (IA)
- **DynamoDB**: Pay-per-request pricing continues
- **CloudWatch Logs**: ~$0.50 per GB ingested
- **SNS**: ~$0.50 per million notifications

### Processing Cost per Report:
- Estimated 5-10 seconds processing time per artifact
- 5 artifacts × 8 seconds × 3008MB = 120 GB-seconds
- Cost: ~$0.024 per complete report processing

This architecture provides a robust, scalable foundation for the Perplexity API report processing feature while maintaining system reliability and cost efficiency.