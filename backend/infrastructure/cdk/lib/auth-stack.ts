import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * AuthStack provisions a Cognito User Pool, Hosted UI domain and a public Web Client
 * configured for implicit grant with OpenID scopes. Callback/logout URLs are provided
 * via environment variables or default to the production domain.
 *
 * Env vars (optional):
 * - COGNITO_DOMAIN_PREFIX: domain prefix for hosted UI (e.g. truflr-ai-prod)
 * - COGNITO_CALLBACK_URL: callback URL (default https://www.truflr.ai/v2/auth/callback)
 * - COGNITO_LOGOUT_URL: logout URL (default https://www.truflr.ai/)
 */
export class AuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const callbackUrl = process.env.COGNITO_CALLBACK_URL || 'https://www.truflr.ai/v2/auth/callback';
    const logoutUrl = process.env.COGNITO_LOGOUT_URL || 'https://www.truflr.ai/';
    const domainPrefix = process.env.COGNITO_DOMAIN_PREFIX || 'truflr-ai-prod';

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      passwordPolicy: { minLength: 8, requireLowercase: true, requireUppercase: false, requireDigits: true, requireSymbols: false },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: undefined, // default retain in production
    });

    // Hosted UI domain
    const domain = userPool.addDomain('HostedDomain', {
      cognitoDomain: { domainPrefix },
    });

    // Public web client for SPA
    const webClient = userPool.addClient('WebClient', {
      authFlows: { userSrp: true },
      generateSecret: false,
      oAuth: {
        flows: { implicitCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [callbackUrl],
        logoutUrls: [logoutUrl],
      },
      preventUserExistenceErrors: true,
    });

    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: webClient.userPoolClientId });
    new CfnOutput(this, 'HostedUIDomain', { value: domain.domainName });
  }
}

