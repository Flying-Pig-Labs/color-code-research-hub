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
      REPOSITORIES_TABLE: 'Repositories',
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
      JOBS_TABLE_NAME: 'PlanGenerationJobs',
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

    // Pipeline item PDF (generate from PipelineRepos body markdown)
    const pipelineItemPdf = makeFn('PipelineItemPdfGenerate', 'handlers.pipeline_item_pdf_generate.handler');
    api.root.addResource('pipeline-items').addResource('{itemId}').addResource('pdf')
      .addMethod('POST', new apigw.LambdaIntegration(pipelineItemPdf), { authorizer });

    // Legacy Repositories API under /api prefix (to avoid CORS mismatch)
    const apiPrefix = api.root.addResource('api');
    const reposRes = apiPrefix.addResource('repositories');
    const repositoriesList = makeFn('RepositoriesList', 'handlers.repositories_list.handler');
    reposRes.addMethod('GET', new apigw.LambdaIntegration(repositoriesList), { authorizer });
    const repositoriesCreate = makeFn('RepositoriesCreate', 'handlers.repositories_create.handler');
    reposRes.addMethod('POST', new apigw.LambdaIntegration(repositoriesCreate), { authorizer });

    // Shark reviews list (with optional userid filter)
    const sharkReviews = apiPrefix.addResource('shark-reviews');
    const reviewsList = makeFn('SharkReviewsList', 'handlers.reviews_list.handler');
    sharkReviews.addMethod('GET', new apigw.LambdaIntegration(reviewsList), { authorizer });

    // GitHub: issue labeling
    const github = apiPrefix.addResource('github');
    const issues = github.addResource('issues');
    const label = issues.addResource('label');
    const githubIssueLabel = makeFn('GitHubIssueLabel', 'handlers.github_issue_label.handler');
    // Allow function to read GitHub token secret and pass env
    const ghSecretArnPrimary = 'arn:aws:secretsmanager:us-east-1:984906149037:secret:github_token_blue_ocean-uv7Z1l';
    const ghSecretArnFallback = 'arn:aws:secretsmanager:us-east-1:984906149037:secret:github_shark_token-HxyxpZ';
    const ghSecretArnAdmin   = 'arn:aws:secretsmanager:us-east-1:984906149037:secret:github_admin-GrrhAa';
    githubIssueLabel.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [ghSecretArnPrimary, ghSecretArnFallback, ghSecretArnAdmin],
    }));
    githubIssueLabel.addEnvironment('GITHUB_TOKEN_SECRET_ARN', `${ghSecretArnPrimary},${ghSecretArnFallback},${ghSecretArnAdmin}`);
    label.addMethod('POST', new apigw.LambdaIntegration(githubIssueLabel), { authorizer });

    // Plan generation job listing + status
    const plan = apiPrefix.addResource('plan');
    const asyncRes = plan.addResource('async');
    const planList = makeFn('PlanJobsList', 'handlers.plan_jobs_list.handler');
    asyncRes.addResource('list').addMethod('GET', new apigw.LambdaIntegration(planList), { authorizer });
    const planStatus = makeFn('PlanJobStatus', 'handlers.plan_job_status.handler');
    asyncRes.addResource('status').addResource('{jobId}')
      .addMethod('GET', new apigw.LambdaIntegration(planStatus), { authorizer });
    // Start (CDK-native) — creates job record and invokes orchestrator directly
    const planStart = makeFn('PlanStartDirect', 'handlers.plan_start_direct.handler');
    planStart.addEnvironment('JOBS_TABLE_NAME', environment.JOBS_TABLE_NAME);
    // Allow discovering orchestrator ARN and invoking it
    planStart.addToRolePolicy(new iam.PolicyStatement({ actions: ['cloudformation:ListExports'], resources: ['*'] }));
    planStart.addToRolePolicy(new iam.PolicyStatement({ actions: ['lambda:InvokeFunction'], resources: ['*'] }));
    asyncRes.addResource('start').addMethod('POST', new apigw.LambdaIntegration(planStart), { authorizer });

    // Idea refine (Anthropic)
    const ideas = apiPrefix.addResource('ideas');
    const refine = ideas.addResource('refine');
    const ideaRefine = makeFn('IdeaRefine', 'handlers.idea_refine.handler');
    const anthropicArn = process.env.ANTHROPIC_API_KEY_SECRET_ARN || 'arn:aws:secretsmanager:us-east-1:984906149037:secret:anthropic_key-*';
    ideaRefine.addToRolePolicy(new iam.PolicyStatement({ actions: ['secretsmanager:GetSecretValue'], resources: [anthropicArn] }));
    ideaRefine.addEnvironment('ANTHROPIC_API_KEY_SECRET_ARN', anthropicArn);
    // Explicit OpenAI key for ideation/refinement path
    const openaiArn = 'arn:aws:secretsmanager:us-east-1:984906149037:secret:openai_key_ideation-xAHR48';
    ideaRefine.addToRolePolicy(new iam.PolicyStatement({ actions: ['secretsmanager:GetSecretValue'], resources: [openaiArn] }));
    ideaRefine.addEnvironment('OPENAI_API_KEY_SECRET_ARN', openaiArn);
    ideaRefine.addEnvironment('OPENAI_MODEL', 'o4-mini-deep-research-2025-06-26');
    refine.addMethod('POST', new apigw.LambdaIntegration(ideaRefine), { authorizer });

    // GitHub README update
    const repos = github.addResource('repos');
    const readme = repos.addResource('readme');
    const updateReadme = makeFn('GitHubUpdateReadme', 'handlers.github_update_readme.handler');
    const ghSecretArn2 = process.env.GITHUB_TOKEN_SECRET_ARN || 'arn:aws:secretsmanager:us-east-1:984906149037:secret:github_token-sIuriy';
    updateReadme.addToRolePolicy(new iam.PolicyStatement({ actions: ['secretsmanager:GetSecretValue'], resources: [ghSecretArn2] }));
    updateReadme.addEnvironment('GITHUB_TOKEN_SECRET_ARN', ghSecretArn2);
    readme.addMethod('POST', new apigw.LambdaIntegration(updateReadme), { authorizer });

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
      'SharkTankReviews',
      'Repositories',
      'PlanGenerationJobs'
    ];
    
    legacyTables.forEach(tableName => {
      const legacyTable = dynamodb.Table.fromTableName(this, `${tableName}Ref`, tableName);
      grantRw(legacyTable);
    });
  }
}
