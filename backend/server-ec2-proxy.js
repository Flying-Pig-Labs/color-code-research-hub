// Simple EC2 Webhook Proxy - Fire and Forget Pattern

import fetch from 'node-fetch';

// Simple EC2 proxy endpoint - immediate response, fire-and-forget processing
export function addEC2ProxyEndpoint(app) {
  const EC2_WEBHOOK_URL = process.env.EC2_WEBHOOK_URL || 'http://54.162.132.68:5000';
  const EC2_WEBHOOK_TOKEN = process.env.EC2_WEBHOOK_TOKEN || 'test-secret-2024';
  const GITHUB_ORG = process.env.VITE_GITHUB_ORG || 'Flying-Pig-Labs';

  // EC2 webhook endpoint - immediate response, fire-and-forget
  app.post('/api/ec2/analyze', async (req, res) => {
    const { teamType, formData, repoId } = req.body;
    
    if (!teamType || !formData || !repoId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['teamType', 'formData', 'repoId']
      });
    }
    
    // Generate repository info
    const repoName = `ci-${teamType}-${repoId}`;
    const repository = `${GITHUB_ORG}/${repoName}`;
    
    console.log(`Research request received: ${repository}`);
    
    // IMMEDIATE RESPONSE - Don't wait for EC2
    res.json({ 
      status: 'accepted',
      message: 'Research request accepted! Processing in background.',
      repoId,
      repository,
      expectedRepoName: repoName,
      githubUrl: `https://github.com/${repository}`,
      estimatedTime: '2-5 minutes'
    });
    
    // FIRE-AND-FORGET: Call EC2 webhook (don't await)
    callEC2Webhook(repository, teamType, formData)
      .catch(error => {
        console.error(`EC2 webhook failed for ${repository}:`, error);
        // Log error but don't affect user experience
      });
  });

  // Fire-and-forget EC2 webhook call
  async function callEC2Webhook(repository, teamType, formData) {
    try {
      console.log(`Calling EC2 webhook for: ${repository}`);
      
      // Create the webhook payload with research specifications
      const webhookPayload = {
        repository: repository,
        branch: 'main',
        researchConfig: {
          teamType: teamType,
          researchSpecs: formData,
          metadata: {
            timestamp: new Date().toISOString(),
            client: process.env.CLIENT_COMPANY_NAME || 'Unknown'
          }
        }
      };
      
      console.log(`EC2 payload:`, JSON.stringify(webhookPayload, null, 2));
      
      // Call the EC2 webhook
      const response = await fetch(`${EC2_WEBHOOK_URL}/webhook`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EC2_WEBHOOK_TOKEN}`
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EC2 webhook failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`EC2 webhook success for ${repository}:`, data);
      
    } catch (error) {
      console.error(`EC2 webhook error for ${repository}:`, error);
      throw error;
    }
  }


  console.log('EC2 webhook proxy endpoint added at /api/ec2/analyze');
  console.log(`EC2 webhook URL: ${EC2_WEBHOOK_URL}`);
  console.log(`Using GitHub org: ${GITHUB_ORG}`);
  console.log('Pattern: Fire-and-forget with immediate response');
}