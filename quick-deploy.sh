#!/bin/bash

# Quick deployment script that handles the entire process
# Run this to deploy everything to AWS Amplify

set -e

echo "🚀 Quick Deploy to AWS Amplify (Personal Profile)"
echo "================================================"

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not installed. Please install it first."; exit 1; }
command -v sam >/dev/null 2>&1 || { echo "❌ SAM CLI not installed. Please install it first."; exit 1; }

# Use personal profile
export AWS_PROFILE=personal

# Verify AWS access
echo "✅ Verifying AWS access..."
aws sts get-caller-identity --profile personal || { echo "❌ AWS authentication failed. Please configure your personal profile."; exit 1; }

# Build the frontend first
echo "🏗️ Building frontend..."
npm run build

# Run the main deployment
echo "🚀 Starting deployment..."
./deploy-to-aws.sh

echo "✅ Quick deploy completed!"