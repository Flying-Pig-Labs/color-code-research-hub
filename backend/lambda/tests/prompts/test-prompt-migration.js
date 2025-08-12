/**
 * @file test-prompt-migration.js
 * @description Test suite for validating prompt migration
 * 
 * This test ensures that migrated prompts maintain exact compatibility
 * with the original inline prompts, preserving variable interpolation
 * and formatting.
 */

const {
  buildSummaryPrompt,
  buildFormatReportPrompt,
  buildMetadataExtractionPrompt,
  buildMetadataImprovementPrompt,
  buildSimplePhaseGenerationPrompt,
  PromptBuilder
} = require('../../handlers/prompts');

describe('Prompt Migration Tests', () => {
  
  describe('Report Processing Prompts', () => {
    test('Summary prompt maintains variable interpolation', () => {
      const testContent = 'This is a test research report about AI trends.';
      const result = buildSummaryPrompt({ content: testContent });
      
      expect(result).toContain('Create a concise 120-word executive summary');
      expect(result).toContain(testContent);
      expect(result).toContain('110-130 words');
    });
    
    test('Format report prompt preserves multiline content', () => {
      const testContent = `Line 1
Line 2
Line 3`;
      const result = buildFormatReportPrompt({ content: testContent });
      
      expect(result).toContain('Format the following raw Perplexity research report');
      expect(result).toContain(testContent);
      expect(result).toContain('## Example Structure');
    });
  });
  
  describe('Metadata Extraction Prompts', () => {
    test('Metadata extraction prompt handles README content', () => {
      const readme = '# My Project\nThis is a test project.';
      const result = buildMetadataExtractionPrompt({ content: readme });
      
      expect(result).toContain('Analyze this README content');
      expect(result).toContain(readme);
      expect(result).toContain('Return only valid JSON');
    });
    
    test('Metadata improvement prompt handles existing data', () => {
      const existingData = {
        title: 'Test Project',
        description: 'A test',
        techStack: ['Node.js']
      };
      const readme = '# Enhanced Project\nNow with React!';
      
      const result = buildMetadataImprovementPrompt({ 
        existingData, 
        readmeContent: readme 
      });
      
      expect(result).toContain('Current data:');
      expect(result).toContain('"title": "Test Project"');
      expect(result).toContain(readme);
    });
    
    test('Simple phase generation handles arrays', () => {
      const metadata = {
        title: 'E-Commerce Platform',
        techStack: ['React', 'Node.js', 'PostgreSQL'],
        features: ['Auth', 'Cart', 'Payment', 'Search']
      };
      
      const result = buildSimplePhaseGenerationPrompt({ metadata });
      
      expect(result).toContain('E-Commerce Platform');
      expect(result).toContain('React, Node.js, PostgreSQL');
      expect(result).toContain('Auth, Cart, Payment, Search');
    });
    
    test('Simple phase generation handles missing data', () => {
      const metadata = {
        title: 'Minimal Project'
        // No techStack or features
      };
      
      const result = buildSimplePhaseGenerationPrompt({ metadata });
      
      expect(result).toContain('Minimal Project');
      expect(result).toContain('Tech: \n'); // Empty tech stack
      expect(result).toContain('Features: \n'); // Empty features
    });
  });
  
  describe('PromptBuilder Utility', () => {
    test('Handles simple variable substitution', () => {
      const template = 'Hello ${name}, welcome to ${place}!';
      const result = new PromptBuilder(template)
        .setVariable('name', 'Alice')
        .setVariable('place', 'Wonderland')
        .build();
      
      expect(result).toBe('Hello Alice, welcome to Wonderland!');
    });
    
    test('Handles array.join() expressions', () => {
      const template = 'Technologies: ${tech.join(", ")}';
      const result = new PromptBuilder(template)
        .setVariable('tech', ['React', 'Node', 'MongoDB'])
        .build();
      
      expect(result).toBe('Technologies: React, Node, MongoDB');
    });
    
    test('Handles nested property access', () => {
      const template = 'Project: ${metadata.title} - ${metadata.description}';
      const result = new PromptBuilder(template)
        .setVariable('metadata', {
          title: 'My App',
          description: 'An awesome app'
        })
        .build();
      
      expect(result).toBe('Project: My App - An awesome app');
    });
    
    test('Handles missing variables with fallback', () => {
      const template = 'Hello ${name}!';
      const result = new PromptBuilder(template, { fallback: '[MISSING]' })
        .build();
      
      expect(result).toBe('Hello [MISSING]!');
    });
    
    test('Throws error in strict mode for missing variables', () => {
      const template = 'Hello ${name}!';
      const builder = new PromptBuilder(template, { strict: true });
      
      expect(() => builder.build()).toThrow();
    });
    
    test('Validates required variables', () => {
      const builder = new PromptBuilder('${a} ${b} ${c}')
        .setVariable('a', 'A')
        .setVariable('b', 'B');
      
      expect(builder.validateRequired(['a', 'b'])).toBe(true);
      expect(builder.validateRequired(['a', 'b', 'c'])).toBe(false);
    });
  });
  
  describe('Backward Compatibility', () => {
    test('Legacy SUMMARY_PROMPT export is available', () => {
      const { SUMMARY_PROMPT } = require('../../handlers/prompts');
      expect(SUMMARY_PROMPT).toBeDefined();
      expect(typeof SUMMARY_PROMPT).toBe('string');
    });
    
    test('Legacy FORMAT_REPORT_PROMPT export is available', () => {
      const { FORMAT_REPORT_PROMPT } = require('../../handlers/prompts');
      expect(FORMAT_REPORT_PROMPT).toBeDefined();
      expect(typeof FORMAT_REPORT_PROMPT).toBe('string');
    });
  });
  
  describe('Complex Expression Handling', () => {
    test('Handles ternary operators', () => {
      const template = 'Status: ${isActive ? "Active" : "Inactive"}';
      
      const activeResult = new PromptBuilder(template)
        .setVariable('isActive', true)
        .build();
      expect(activeResult).toBe('Status: Active');
      
      const inactiveResult = new PromptBuilder(template)
        .setVariable('isActive', false)
        .build();
      expect(inactiveResult).toBe('Status: Inactive');
    });
    
    test('Handles custom transformers', () => {
      const template = 'Items: ${items}';
      const result = new PromptBuilder(template)
        .setVariable('items', ['apple', 'banana', 'orange'])
        .setTransformer('items', (arr) => arr.map(i => `• ${i}`).join('\n'))
        .build();
      
      expect(result).toBe('Items: • apple\n• banana\n• orange');
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running prompt migration tests...');
  require('jest').run();
}