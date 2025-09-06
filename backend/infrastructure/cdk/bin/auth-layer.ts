#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';

const app = new App();
new AuthStack(app, 'AuthStack', {
  /* Default env; region/account inherited from CLI */
});

