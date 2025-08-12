// Lambda function for teams endpoints
const teamFields = {
  red: [
    { name: 'objective', label: 'Red Team Objective', type: 'textarea', required: true },
    { name: 'scope', label: 'Scope', type: 'textarea', required: true },
    { name: 'timeline', label: 'Timeline', type: 'text', required: false },
    { name: 'methodology', label: 'Methodology', type: 'select', required: true, 
      options: ['Penetration Testing', 'Social Engineering', 'Physical Security', 'Combined'] },
    { name: 'targetSystems', label: 'Target Systems', type: 'textarea', required: true },
    { name: 'constraints', label: 'Constraints', type: 'textarea', required: false }
  ],
  black: [
    { name: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'version', label: 'Version', type: 'text', required: false },
    { name: 'analysisType', label: 'Analysis Type', type: 'select', required: true,
      options: ['Vulnerability Research', 'Exploit Development', 'Patch Analysis', 'Full Assessment'] },
    { name: 'priority', label: 'Priority', type: 'select', required: true,
      options: ['Critical', 'High', 'Medium', 'Low'] },
    { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false }
  ],
  white: [
    { name: 'whitespaceType', label: 'Whitespace Type', type: 'select', required: true,
      options: ['Market Analysis', 'Competitive Intelligence', 'Technology Trends', 'Strategic Planning'] },
    { name: 'targetMarket', label: 'Target Market', type: 'text', required: true },
    { name: 'competitors', label: 'Key Competitors', type: 'textarea', required: false },
    { name: 'timeframe', label: 'Analysis Timeframe', type: 'select', required: true,
      options: ['Immediate (1-3 months)', 'Short-term (3-6 months)', 'Medium-term (6-12 months)', 'Long-term (12+ months)'] },
    { name: 'deliverables', label: 'Expected Deliverables', type: 'textarea', required: true },
    { name: 'budget', label: 'Budget Range', type: 'text', required: false }
  ]
};

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  const path = event.path;
  
  // GET /teams
  if (path === '/teams' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(['red', 'black', 'white'])
    };
  }
  
  // GET /teams/:teamType/fields
  const fieldsMatch = path.match(/^\/teams\/(\w+)\/fields$/);
  if (fieldsMatch && event.httpMethod === 'GET') {
    const teamType = fieldsMatch[1];
    
    if (!teamFields[teamType]) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Team type not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(teamFields[teamType])
    };
  }
  
  // Not found
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Endpoint not found' })
  };
};