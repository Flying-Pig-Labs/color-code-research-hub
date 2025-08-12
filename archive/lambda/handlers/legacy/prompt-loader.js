/**
 * Simple prompt loader that reads .txt files and does variable substitution
 */

const fs = require('fs');
const path = require('path');

// Cache for loaded prompts
const promptCache = {};

/**
 * Load a prompt from a .txt file
 * @param {string} promptName - Name of the prompt file (without .txt)
 * @returns {string} The prompt template
 */
function loadPromptTemplate(promptName) {
  // Check cache first
  if (promptCache[promptName]) {
    return promptCache[promptName];
  }
  
  try {
    const promptPath = path.join(__dirname, 'prompts-txt', `${promptName}.txt`);
    const template = fs.readFileSync(promptPath, 'utf8');
    
    // Cache it
    promptCache[promptName] = template;
    
    return template;
  } catch (error) {
    console.error(`Failed to load prompt ${promptName}:`, error.message);
    throw new Error(`Prompt not found: ${promptName}`);
  }
}

/**
 * Build a prompt by replacing variables
 * @param {string} promptName - Name of the prompt file
 * @param {Object} variables - Variables to substitute
 * @returns {string} The built prompt
 */
function buildPrompt(promptName, variables = {}) {
  let template = loadPromptTemplate(promptName);
  
  // Replace ${variable} with actual values
  Object.entries(variables).forEach(([key, value]) => {
    let stringValue = '';
    
    if (value === null || value === undefined) {
      stringValue = '';
    } else if (Array.isArray(value)) {
      stringValue = value.join(', ');
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value, null, 2);
    } else {
      stringValue = String(value);
    }
    
    const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
    template = template.replace(pattern, stringValue);
  });
  
  return template;
}

/**
 * Preload all prompts into cache (optional, for Lambda warm starts)
 */
function preloadAllPrompts() {
  const promptDir = path.join(__dirname, 'prompts-txt');
  
  try {
    const files = fs.readdirSync(promptDir);
    
    files.forEach(file => {
      if (file.endsWith('.txt')) {
        const promptName = file.replace('.txt', '');
        loadPromptTemplate(promptName);
      }
    });
    
    console.log(`Preloaded ${files.length} prompts`);
  } catch (error) {
    console.error('Failed to preload prompts:', error.message);
  }
}

module.exports = {
  loadPromptTemplate,
  buildPrompt,
  preloadAllPrompts
};