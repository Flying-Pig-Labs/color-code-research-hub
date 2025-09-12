import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Data layer resources for the V2 platform.
 * Defines DynamoDB tables, GSIs, S3 buckets and base IAM role
 * used by application Lambdas. This is a scaffold only – business
 * logic Lambdas should be added in dedicated stacks.
 */
export class DataLayerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Users table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSIUsersByCreated',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Credit ledger table
    const ledgerTable = new dynamodb.Table(this, 'CreditLedgerTable', {
      tableName: 'CreditLedger',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'txId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    ledgerTable.addGlobalSecondaryIndex({
      indexName: 'GSI_LedgerByTime',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'ts', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    ledgerTable.addGlobalSecondaryIndex({
      indexName: 'GSI_LedgerGlobal',
      partitionKey: { name: 'reason', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'ts', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Projects table
    const projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
      tableName: 'Projects',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    projectsTable.addGlobalSecondaryIndex({
      indexName: 'GSI_ProjectsByUser',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Double-downs table
    const doublesTable = new dynamodb.Table(this, 'DoubleDownsTable', {
      tableName: 'DoubleDowns',
      partitionKey: { name: 'doubleId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    doublesTable.addGlobalSecondaryIndex({
      indexName: 'GSI_DoublesByProject',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startedAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // IAM role for application Lambdas
    const appRole = new iam.Role(this, 'AppLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    appRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    [usersTable, ledgerTable, projectsTable, doublesTable].forEach(t => t.grantReadWriteData(appRole));

    // Outputs for easier discovery
    new CfnOutput(this, 'UsersTableName', { value: usersTable.tableName });
    new CfnOutput(this, 'CreditLedgerTableName', { value: ledgerTable.tableName });
    new CfnOutput(this, 'ProjectsTableName', { value: projectsTable.tableName });
    new CfnOutput(this, 'DoubleDownsTableName', { value: doublesTable.tableName });
  }
}

