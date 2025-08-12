const FORM_POPULATION_PROMPT = `Based on this README, suggest improvements and additions to the project metadata.

README:
{readmeContent}

Current known values:
- Title: {title}
- Description: {description}
- Basic Features: {basicFeatures}
- Basic Tech Stack: {basicTechStack}

Return improved metadata in JSON with fields: title, description, targetUsers, techStack, features, domain, complexity.`;

module.exports = { FORM_POPULATION_PROMPT };


