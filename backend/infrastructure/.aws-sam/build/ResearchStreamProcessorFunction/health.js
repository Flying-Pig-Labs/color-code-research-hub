// Lambda function for health check endpoint
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify({
      status: 'healthy',
      environment: process.env.ENVIRONMENT || 'production',
      timestamp: new Date().toISOString()
    })
  };
};