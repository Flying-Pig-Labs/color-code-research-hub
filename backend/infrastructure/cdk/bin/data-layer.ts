#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { DataLayerStack } from '../lib/data-layer-stack';

const app = new App();
new DataLayerStack(app, 'DataLayerStack', {
  /* Use default AWS environment; allows synthesis in any account/region. */
});
