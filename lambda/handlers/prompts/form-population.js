export const FORM_POPULATION_PROMPT = `You are an AI assistant that analyzes project README content to intelligently suggest form field values for a project planning tool.

Given the README content below, analyze it and provide intelligent suggestions for the following fields:

1. **Target Users**: Identify the primary user groups or personas who would use this product based on the README content. Consider both explicitly mentioned users and inferred users based on features.

2. **Tech Stack**: Extract and infer the technologies, frameworks, libraries, and tools used in the project. Look for:
   - Explicitly mentioned technologies
   - Dependencies in package files
   - File extensions and project structure clues
   - API mentions and integrations

3. **Key Features**: Extract the main features and capabilities of the project. Look for:
   - Feature lists
   - Functionality descriptions
   - Use cases mentioned
   - Problem-solving capabilities

4. **Domain**: Determine the most appropriate domain category based on the project's purpose and functionality.

5. **Complexity**: Assess the project complexity as simple, moderate, or complex based on:
   - Number of features
   - Technical stack diversity
   - Integration requirements
   - Scalability mentions

README CONTENT:
{readmeContent}

EXISTING PARSED DATA (use this as context but provide enhanced suggestions):
Title: {title}
Description: {description}
Basic Features: {basicFeatures}
Basic Tech Stack: {basicTechStack}

Provide your analysis in the following JSON format:
{
  "title": "Improved project title based on README",
  "description": "A comprehensive description based on the README content",
  "targetUsers": ["user group 1", "user group 2", ...],
  "techStack": ["technology 1", "technology 2", ...],
  "features": ["feature 1", "feature 2", ...],
  "domain": "domain_category",
  "complexity": "simple|moderate|complex"
}`;