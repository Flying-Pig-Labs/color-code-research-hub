import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';

/**
 * API gateway and Lambda wiring for the V2 platform. All business logic
 * handlers live under `backend/lambda/v2/handlers` and are simple Python
 * functions. This stack connects routes to those handlers and wires common
 * environment variables.
 */
export class ApiLayerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool',
      process.env.USER_POOL_ID || 'dummy');

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [userPool],
    });

    const api = new apigw.RestApi(this, 'HttpApi', {
      restApiName: 'V2HttpApi',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'Accept', 'Idempotency-Key'],
      },
    });

    // Ensure CORS headers on default 4xx/5xx responses
    api.addGatewayResponse('Default4xx', {
      type: apigw.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'*'",
        'Access-Control-Allow-Methods': "'*'",
      },
    });
    api.addGatewayResponse('Default5xx', {
      type: apigw.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'*'",
        'Access-Control-Allow-Methods': "'*'",
      },
    });

    const environment = {
      USERS_TABLE_NAME: process.env.USERS_TABLE_NAME || '',
      CREDIT_LEDGER_TABLE_NAME: process.env.CREDIT_LEDGER_TABLE_NAME || '',
      DOUBLES_TABLE_NAME: process.env.DOUBLES_TABLE_NAME || '',
      // Legacy table names for backward compatibility
      PIPELINE_REPOS_TABLE: 'PipelineRepos',
      RESEARCH_REPORTS_TABLE: 'ResearchReports',
      PIPELINE_BATCH_JOBS_TABLE: 'PipelineBatchJobs',
      SHARK_TANK_REVIEWS_TABLE: 'SharkTankReviews',
      RESEARCH_BUCKET: 'color-code-research-results-984906149037',
      PROJECTS_TABLE_NAME: process.env.PROJECTS_TABLE_NAME || 'Projects',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_PRICE_CREDIT: process.env.STRIPE_PRICE_CREDIT || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      STRIPE_API_KEY_SECRET_ARN: process.env.STRIPE_API_KEY_SECRET_ARN || '',
      STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || '',
      STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL || '',
      COGNITO_HOSTED_UI_DOMAIN: process.env.COGNITO_HOSTED_UI_DOMAIN || '',
      COGNITO_CLIENT_ID: process.env.USER_POOL_CLIENT_ID || process.env.COGNITO_CLIENT_ID || '',
      PUBLIC_MODE: process.env.PUBLIC_MODE || '',
    };

    // Package both handlers/ and helpers/ so Python imports work
    // Handlers live under backend/lambda/v2/handlers, helpers under backend/lambda/v2/helpers
    const code = lambda.Code.fromAsset(path.join(__dirname, '../../../lambda/v2'));
    const fns: lambda.Function[] = [];
    const makeFn = (id: string, handler: string) => {
      const fn = new lambda.Function(this, id, {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler,
        code,
        environment,
      });
      fns.push(fn);
      return fn;
    };

    // Billing
    const billingSession = makeFn('BillingStripeSession', 'handlers.billing_stripe_session.handler');
    api.root.addResource('billing').addResource('stripe').addResource('create-checkout-session')
      .addMethod('POST', new apigw.LambdaIntegration(billingSession), { authorizer });

    const billingWebhook = makeFn('BillingStripeWebhook', 'handlers.billing_stripe_webhook.handler');
    api.root.getResource('billing')!.getResource('stripe')!.addResource('webhook')
      .addMethod('POST', new apigw.LambdaIntegration(billingWebhook));

    // Allow billing functions to read Stripe API key secret if provided
    const stripeSecretArn = process.env.STRIPE_API_KEY_SECRET_ARN || '';
    if (stripeSecretArn) {
      const policy = new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [stripeSecretArn],
      });
      billingSession.addToRolePolicy(policy);
      billingWebhook.addToRolePolicy(policy);
    }

    const balance = makeFn('CreditsBalance', 'handlers.credits_balance.handler');
    api.root.addResource('credits').addResource('balance')
      .addMethod('GET', new apigw.LambdaIntegration(balance), { authorizer });

    // Projects (using legacy PipelineRepos table)
    const projects = api.root.addResource('projects');
    const projectCreate = makeFn('ProjectsCreate', 'handlers.projects_create.handler');
    projects.addMethod('POST', new apigw.LambdaIntegration(projectCreate), { authorizer });
    // Return proper Projects[]; legacy repos/issues available via query param in handler
    const projectList = makeFn('ProjectsList', 'handlers.projects_list.handler');
    projects.addMethod('GET', new apigw.LambdaIntegration(projectList), { authorizer });
    const projectItem = projects.addResource('{projectId}');
    const projectGetFn = makeFn('ProjectsGet', 'handlers.projects_get.handler');
    projectItem.addMethod('GET', new apigw.LambdaIntegration(projectGetFn), { authorizer });

    // Reports (using legacy ResearchReports table)
    const reportStart = makeFn('ReportStart', 'handlers.report_start.handler');
    projectItem.addResource('report').addResource('start')
      .addMethod('POST', new apigw.LambdaIntegration(reportStart), { authorizer });
    const reports = api.root.addResource('reports');
    const reportsList = makeFn('ReportsList', 'handlers.research_reports_list.handler');
    reports.addMethod('GET', new apigw.LambdaIntegration(reportsList), { authorizer });
    const reportGet = makeFn('ReportGet', 'handlers.report_get.handler');
    const reportItem = reports.addResource('{reportId}');
    reportItem.addMethod('GET', new apigw.LambdaIntegration(reportGet), { authorizer });
    
    // PDF generation endpoint
    const reportPdfGenerate = makeFn('ReportPdfGenerate', 'handlers.report_pdf_generate.handler');
    reportItem.addResource('pdf')
      .addMethod('POST', new apigw.LambdaIntegration(reportPdfGenerate), { authorizer });

    // Ideation (using legacy PipelineBatchJobs table)
    const ideationStart = makeFn('IdeationStart', 'handlers.ideation_start.handler');
    projectItem.addResource('ideation').addResource('start')
      .addMethod('POST', new apigw.LambdaIntegration(ideationStart), { authorizer });
    const ideations = api.root.addResource('ideations');
    const ideationsList = makeFn('IdeationsList', 'handlers.pipeline_ideations_list.handler');
    ideations.addMethod('GET', new apigw.LambdaIntegration(ideationsList), { authorizer });
    const ideationGet = makeFn('IdeationGet', 'handlers.ideation_get.handler');
    ideations.addResource('{ideationId}')
      .addMethod('GET', new apigw.LambdaIntegration(ideationGet), { authorizer });

    // Double-down
    const doubleStart = makeFn('DoubleStart', 'handlers.double_start.handler');
    projectItem.addResource('double-down').addResource('start')
      .addMethod('POST', new apigw.LambdaIntegration(doubleStart), { authorizer });
    const doubleGet = makeFn('DoubleGet', 'handlers.double_get.handler');
    api.root.addResource('double-downs').addResource('{doubleId}')
      .addMethod('GET', new apigw.LambdaIntegration(doubleGet), { authorizer });

    // Admin
    const admin = api.root.addResource('admin');
    const adminUsers = makeFn('AdminUsers', 'handlers.admin_users.handler');
    const adminUsersRes = admin.addResource('users');
    adminUsersRes.addMethod('GET', new apigw.LambdaIntegration(adminUsers), { authorizer });
    const adminUserGet = makeFn('AdminUserGet', 'handlers.admin_user_get.handler');
    adminUsersRes.addResource('{id}').addMethod('GET', new apigw.LambdaIntegration(adminUserGet), { authorizer });
    const adminMetrics = makeFn('AdminMetrics', 'handlers.admin_metrics.handler');
    const metricsRes = admin.addResource('metrics');
    metricsRes.addMethod('GET', new apigw.LambdaIntegration(adminMetrics), { authorizer });
    metricsRes.addResource('summary')
      .addMethod('GET', new apigw.LambdaIntegration(adminMetrics), { authorizer });
    const adminAdjust = makeFn('AdminCreditsAdjust', 'handlers.admin_credits_adjust.handler');
    admin.addResource('credits').addResource('adjust')
      .addMethod('POST', new apigw.LambdaIntegration(adminAdjust), { authorizer });

    // Public config endpoint for frontend to discover Cognito details at runtime
    const configGet = makeFn('ConfigGet', 'handlers.config_get.handler');
    api.root.addResource('config').addMethod('GET', new apigw.LambdaIntegration(configGet));

    // Grant IAM permissions to access DDB tables and S3 bucket
    const usersTable = environment.USERS_TABLE_NAME
      ? dynamodb.Table.fromTableName(this, 'UsersTableRef', environment.USERS_TABLE_NAME)
      : undefined;
    const ledgerTable = environment.CREDIT_LEDGER_TABLE_NAME
      ? dynamodb.Table.fromTableName(this, 'LedgerTableRef', environment.CREDIT_LEDGER_TABLE_NAME)
      : undefined;
    const projectsTable = environment.PROJECTS_TABLE_NAME
      ? dynamodb.Table.fromTableName(this, 'ProjectsTableRef', environment.PROJECTS_TABLE_NAME)
      : undefined;
    const doublesTable = environment.DOUBLES_TABLE_NAME
      ? dynamodb.Table.fromTableName(this, 'DoublesTableRef', environment.DOUBLES_TABLE_NAME)
      : undefined;
    const researchBucket = environment.RESEARCH_BUCKET
      ? s3.Bucket.fromBucketName(this, 'ResearchBucketRef', environment.RESEARCH_BUCKET)
      : undefined;

    const grantRw = (table?: dynamodb.ITable) => {
      if (!table) return;
      fns.forEach(fn => table.grantReadWriteData(fn));
    };
    grantRw(usersTable);
    grantRw(ledgerTable);
    grantRw(projectsTable);
    grantRw(doublesTable);
    if (researchBucket) {
      fns.forEach(fn => researchBucket.grantReadWrite(fn));
    }

    // Ensure functions can query GSIs explicitly (belt-and-suspenders)
    if (projectsTable) {
      const projectsIndexArn = `${projectsTable.tableArn}/index/*`;
      fns.forEach(fn => fn.addToRolePolicy(new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan', 'dynamodb:DescribeTable'],
        resources: [projectsIndexArn],
      })));
    }

    // Grant access to legacy tables
    const legacyTables = [
      'PipelineRepos',
      'ResearchReports', 
      'PipelineBatchJobs',
      'SharkTankReviews'
    ];
    
    legacyTables.forEach(tableName => {
      const legacyTable = dynamodb.Table.fromTableName(this, `${tableName}Ref`, tableName);
      grantRw(legacyTable);
    });
  }
}
