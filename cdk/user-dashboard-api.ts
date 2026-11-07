import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface UserDashboardApiProps {
  api: apigateway.RestApi;
  cognitoUserPoolId: string;
}

/**
 * CDK Construct for User Dashboard API endpoints
 * Adds user-scoped data access to the existing Color Code Research Hub API
 */
export class UserDashboardApi extends Construct {
  public readonly userResources: apigateway.Resource[];
  public readonly lambdaFunctions: lambda.Function[];

  constructor(scope: Construct, id: string, props: UserDashboardApiProps) {
    super(scope, id);

    // Create Lambda execution role with DynamoDB permissions
    const lambdaRole = new iam.Role(this, 'UserDashboardLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:Scan',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ],
              resources: [
                'arn:aws:dynamodb:*:*:table/ResearchReports',
                'arn:aws:dynamodb:*:*:table/PipelineBatchJobs',
                'arn:aws:dynamodb:*:*:table/PipelineRepos',
                'arn:aws:dynamodb:*:*:table/SharkTankReviews',
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject'],
              resources: ['arn:aws:s3:::*'],
            }),
          ],
        }),
      },
    });

    // Lambda Layer for shared user helper functions
    const userHelpersLayer = new lambda.LayerVersion(this, 'UserHelpersLayer', {
      code: lambda.Code.fromAsset('lambdas'), // Contains user_helpers.py
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: 'User helper functions for JWT processing and user mapping',
    });

    // Create Lambda functions for each user endpoint
    const functions = [
      {
        name: 'UserResearchReports',
        handler: 'user_research_reports.handler',
        description: 'Get user-scoped research reports',
        path: 'research/reports',
        methods: ['GET', 'OPTIONS'],
      },
      {
        name: 'UserPipelineJobs',
        handler: 'user_pipeline_jobs.handler',
        description: 'Get user-scoped pipeline jobs',
        path: 'pipeline/jobs',
        methods: ['GET', 'OPTIONS'],
      },
      {
        name: 'UserRepositories',
        handler: 'user_repositories.handler',
        description: 'Get user-scoped repositories and issues',
        path: 'repositories',
        methods: ['GET', 'OPTIONS'],
      },
      {
        name: 'UserBuildRepository',
        handler: 'user_build_repository.handler',
        description: 'Trigger repository build from user idea',
        path: 'build/repository',
        methods: ['POST', 'OPTIONS'],
      },
    ];

    this.lambdaFunctions = [];
    this.userResources = [];

    // Create /api/user resource
    const userResource = props.api.root
      .resourceForPath('api')
      .addResource('user');

    functions.forEach(({ name, handler, description, path, methods }) => {
      // Create Lambda function
      const lambdaFunction = new lambda.Function(this, name, {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler,
        code: lambda.Code.fromAsset('lambdas'),
        role: lambdaRole,
        layers: [userHelpersLayer],
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
          REGION: cdk.Stack.of(this).region,
        },
        description,
      });

      this.lambdaFunctions.push(lambdaFunction);

      // Create API resource and integration
      const pathSegments = path.split('/');
      let currentResource = userResource;
      
      // Build nested resource path
      for (const segment of pathSegments) {
        const existingResource = currentResource.getResource(segment);
        currentResource = existingResource || currentResource.addResource(segment);
      }

      this.userResources.push(currentResource);

      // Add methods
      const integration = new apigateway.LambdaIntegration(lambdaFunction, {
        requestTemplates: { 'application/json': '{"statusCode": "200"}' },
      });

      methods.forEach(method => {
        if (method === 'OPTIONS') {
          // Add CORS preflight
          currentResource.addMethod('OPTIONS', new apigateway.MockIntegration({
            integrationResponses: [
              {
                statusCode: '200',
                responseParameters: {
                  'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                  'method.response.header.Access-Control-Allow-Origin': "'*'",
                  'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,POST,PUT,DELETE'",
                },
              },
            ],
            requestTemplates: {
              'application/json': '{"statusCode": 200}',
            },
          }), {
            methodResponses: [
              {
                statusCode: '200',
                responseParameters: {
                  'method.response.header.Access-Control-Allow-Headers': true,
                  'method.response.header.Access-Control-Allow-Methods': true,
                  'method.response.header.Access-Control-Allow-Origin': true,
                },
              },
            ],
          });
        } else {
          currentResource.addMethod(method, integration, {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: {
              authorizerId: 'your-cognito-authorizer-id', // Replace with actual authorizer
            },
            methodResponses: [
              {
                statusCode: '200',
                responseParameters: {
                  'method.response.header.Access-Control-Allow-Origin': true,
                },
              },
            ],
          });
        }
      });
    });
  }
}