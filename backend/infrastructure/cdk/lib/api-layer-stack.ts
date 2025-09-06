import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

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
    });

    const environment = {
      USERS_TABLE_NAME: process.env.USERS_TABLE_NAME || '',
      CREDIT_LEDGER_TABLE_NAME: process.env.CREDIT_LEDGER_TABLE_NAME || '',
      PROJECTS_TABLE_NAME: process.env.PROJECTS_TABLE_NAME || '',
      REPORTS_TABLE_NAME: process.env.REPORTS_TABLE_NAME || '',
      IDEATIONS_TABLE_NAME: process.env.IDEATIONS_TABLE_NAME || '',
      DOUBLES_TABLE_NAME: process.env.DOUBLES_TABLE_NAME || '',
      ARTIFACTS_BUCKET_NAME: process.env.ARTIFACTS_BUCKET_NAME || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_PRICE_CREDIT: process.env.STRIPE_PRICE_CREDIT || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    };

    // Handlers live at backend/lambda/v2/handlers relative to this file
    const code = lambda.Code.fromAsset(path.join(__dirname, '../../../lambda/v2/handlers'));
    const makeFn = (id: string, handler: string) => new lambda.Function(this, id, {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler,
      code,
      environment,
    });

    // Billing
    const billingSession = makeFn('BillingStripeSession', 'billing_stripe_session.handler');
    api.root.addResource('billing').addResource('stripe').addResource('create-checkout-session')
      .addMethod('POST', new apigw.LambdaIntegration(billingSession), { authorizer });

    const billingWebhook = makeFn('BillingStripeWebhook', 'billing_stripe_webhook.handler');
    api.root.getResource('billing')!.getResource('stripe')!.addResource('webhook')
      .addMethod('POST', new apigw.LambdaIntegration(billingWebhook));

    const balance = makeFn('CreditsBalance', 'credits_balance.handler');
    api.root.addResource('credits').addResource('balance')
      .addMethod('GET', new apigw.LambdaIntegration(balance), { authorizer });

    // Projects
    const projects = api.root.addResource('projects');
    const projectCreate = makeFn('ProjectsCreate', 'projects_create.handler');
    projects.addMethod('POST', new apigw.LambdaIntegration(projectCreate), { authorizer });
    const projectList = makeFn('ProjectsList', 'projects_list.handler');
    projects.addMethod('GET', new apigw.LambdaIntegration(projectList), { authorizer });
    const projectItem = projects.addResource('{projectId}');
    const projectGetFn = makeFn('ProjectsGet', 'projects_get.handler');
    projectItem.addMethod('GET', new apigw.LambdaIntegration(projectGetFn), { authorizer });

    // Reports
    const reportStart = makeFn('ReportStart', 'report_start.handler');
    projectItem.addResource('report').addResource('start')
      .addMethod('POST', new apigw.LambdaIntegration(reportStart), { authorizer });
    const reportGet = makeFn('ReportGet', 'report_get.handler');
    api.root.addResource('reports').addResource('{reportId}')
      .addMethod('GET', new apigw.LambdaIntegration(reportGet), { authorizer });

    // Ideation
    const ideationStart = makeFn('IdeationStart', 'ideation_start.handler');
    projectItem.addResource('ideation').addResource('start')
      .addMethod('POST', new apigw.LambdaIntegration(ideationStart), { authorizer });
    const ideationGet = makeFn('IdeationGet', 'ideation_get.handler');
    api.root.addResource('ideations').addResource('{ideationId}')
      .addMethod('GET', new apigw.LambdaIntegration(ideationGet), { authorizer });

    // Double-down
    const doubleStart = makeFn('DoubleStart', 'double_start.handler');
    projectItem.addResource('double-down').addResource('start')
      .addMethod('POST', new apigw.LambdaIntegration(doubleStart), { authorizer });
    const doubleGet = makeFn('DoubleGet', 'double_get.handler');
    api.root.addResource('double-downs').addResource('{doubleId}')
      .addMethod('GET', new apigw.LambdaIntegration(doubleGet), { authorizer });

    // Admin
    const admin = api.root.addResource('admin');
    const adminUsers = makeFn('AdminUsers', 'admin_users.handler');
    const adminUsersRes = admin.addResource('users');
    adminUsersRes.addMethod('GET', new apigw.LambdaIntegration(adminUsers), { authorizer });
    const adminUserGet = makeFn('AdminUserGet', 'admin_user_get.handler');
    adminUsersRes.addResource('{id}').addMethod('GET', new apigw.LambdaIntegration(adminUserGet), { authorizer });
    const adminMetrics = makeFn('AdminMetrics', 'admin_metrics.handler');
    admin.addResource('metrics').addResource('summary')
      .addMethod('GET', new apigw.LambdaIntegration(adminMetrics), { authorizer });
    const adminAdjust = makeFn('AdminCreditsAdjust', 'admin_credits_adjust.handler');
    admin.addResource('credits').addResource('adjust')
      .addMethod('POST', new apigw.LambdaIntegration(adminAdjust), { authorizer });
  }
}
