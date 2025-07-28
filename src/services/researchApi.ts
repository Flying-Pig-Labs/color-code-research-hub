interface ResearchRequest {
  task: string;
  teamType?: 'red' | 'white' | 'black';
}

interface ResearchResponse {
  request_id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

const EC2_ENDPOINT = import.meta.env.VITE_EC2_ENDPOINT || 'http://localhost:8080';

export async function submitResearch(request: ResearchRequest): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${EC2_ENDPOINT}/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Research submission failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting research:', error);
    throw error;
  }
}

export async function checkResearchStatus(requestId: string): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${EC2_ENDPOINT}/execution/${requestId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking research status:', error);
    throw error;
  }
}

export function formatRedTeamPrompt(formData: any): string {
  return `RED TEAM - Competitive Disruption Analysis

Target: ${formData.targetCompany || 'Not specified'}
Industry: ${formData.industry || 'Not specified'}

Analysis Type: ${formData.analysisType || 'Comprehensive'}
- Competitive Mapping
- Market Analysis  
- Strategic Modeling

Specific Focus Areas:
${formData.specificRequirements || 'General competitive analysis'}

Please provide strategic analysis of marketplace competitors and identify disruption opportunities.`;
}

export function formatWhiteTeamPrompt(formData: any): string {
  return `WHITE TEAM - Market Opportunity Discovery

Market Segment: ${formData.marketSegment || 'Not specified'}
Target Users: ${formData.targetUsers || 'Not specified'}

Discovery Focus: ${formData.discoveryFocus || 'White space identification'}
- White space identification
- Opportunity mapping
- Gap analysis

Research Requirements:
${formData.researchRequirements || 'Identify market gaps and opportunities'}

Please analyze market white spaces and identify new product opportunities.`;
}

export function formatBlackTeamPrompt(formData: any): string {
  return `BLACK TEAM - Vendor Replacement Engineering

Target Vendor: ${formData.targetVendor || 'Not specified'}
Product/Service: ${formData.productService || 'Not specified'}

Engineering Focus: ${formData.engineeringFocus || 'Full replacement strategy'}
- Reverse engineering
- Technical analysis
- Implementation pathways

Technical Requirements:
${formData.technicalRequirements || 'Complete vendor replacement analysis'}

Please provide reverse engineering analysis and vendor replacement strategies.`;
}