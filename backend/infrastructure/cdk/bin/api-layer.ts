#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { ApiLayerStack } from '../lib/api-layer-stack';

const app = new App();
new ApiLayerStack(app, 'ApiLayerStack', {
  /* stack synthesised with default env */
});
