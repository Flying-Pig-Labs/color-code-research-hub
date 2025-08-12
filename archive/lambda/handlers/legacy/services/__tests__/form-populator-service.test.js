const { AIFormPopulator } = require('../form-populator-service');

describe('AIFormPopulator', () => {
  let populator;

  beforeEach(() => {
    populator = new AIFormPopulator();
  });

  describe('deduplicateAndClean', () => {
    it('should remove duplicates case-insensitively', () => {
      const items = ['React', 'react', 'REACT', 'Vue', 'vue'];
      const result = populator.deduplicateAndClean(items);
      expect(result).toEqual(['React', 'Vue']);
    });

    it('should trim whitespace', () => {
      const items = ['  React  ', '\tVue\n', ' Angular '];
      const result = populator.deduplicateAndClean(items);
      expect(result).toEqual(['React', 'Vue', 'Angular']);
    });

    it('should filter empty strings', () => {
      const items = ['React', '', '   ', 'Vue'];
      const result = populator.deduplicateAndClean(items);
      expect(result).toEqual(['React', 'Vue']);
    });

    it('should filter items over 100 characters', () => {
      const longString = 'a'.repeat(101);
      const items = ['React', longString, 'Vue'];
      const result = populator.deduplicateAndClean(items);
      expect(result).toEqual(['React', 'Vue']);
    });

    it('should handle non-array input', () => {
      expect(populator.deduplicateAndClean(null)).toEqual([]);
      expect(populator.deduplicateAndClean(undefined)).toEqual([]);
      expect(populator.deduplicateAndClean('string')).toEqual([]);
      expect(populator.deduplicateAndClean(123)).toEqual([]);
      expect(populator.deduplicateAndClean({})).toEqual([]);
    });

    it('should preserve order of first occurrence', () => {
      const items = ['Vue', 'React', 'vue', 'Angular', 'react'];
      const result = populator.deduplicateAndClean(items);
      expect(result).toEqual(['Vue', 'React', 'Angular']);
    });
  });

  describe('validateDomain', () => {
    it('should return valid domain as-is', () => {
      expect(populator.validateDomain('e-commerce')).toBe('e-commerce');
      expect(populator.validateDomain('healthcare')).toBe('healthcare');
      expect(populator.validateDomain('devtools')).toBe('devtools');
      expect(populator.validateDomain('iot')).toBe('iot');
      expect(populator.validateDomain('gaming')).toBe('gaming');
    });

    it('should normalize domain with spaces', () => {
      expect(populator.validateDomain('e commerce')).toBe('e-commerce');
      expect(populator.validateDomain('social media')).toBe('social-media');
      expect(populator.validateDomain('dev tools')).toBe('general'); // 'dev-tools' is not in valid list
    });

    it('should handle case insensitively', () => {
      expect(populator.validateDomain('E-Commerce')).toBe('e-commerce');
      expect(populator.validateDomain('HEALTHCARE')).toBe('healthcare');
      expect(populator.validateDomain('IoT')).toBe('iot');
    });

    it('should handle multiple spaces', () => {
      expect(populator.validateDomain('e    commerce')).toBe('e-commerce');
      expect(populator.validateDomain('social   media')).toBe('social-media');
    });

    it('should return general for invalid domains', () => {
      expect(populator.validateDomain('invalid-domain')).toBe('general');
      expect(populator.validateDomain('random')).toBe('general');
      expect(populator.validateDomain('')).toBe('general');
      expect(populator.validateDomain('blockchain')).toBe('general'); // Not in valid list
      expect(populator.validateDomain('ai-ml')).toBe('general'); // Not in valid list
    });

    it('should validate all expected domains', () => {
      const validDomains = [
        'e-commerce', 'social-media', 'productivity', 'healthcare',
        'education', 'finance', 'entertainment', 'devtools',
        'iot', 'general', 'communication', 'analytics', 'gaming'
      ];

      validDomains.forEach(domain => {
        expect(populator.validateDomain(domain)).toBe(domain);
      });
    });
  });

  describe('getFallbackSuggestions', () => {
    it('should return default values when no existing data', () => {
      const result = populator.getFallbackSuggestions();
      expect(result).toEqual({
        title: 'Untitled Project',
        description: 'A new project',
        targetUsers: ['developers', 'end-users'],
        techStack: ['JavaScript', 'Node.js'],
        features: ['Core functionality'],
        domain: 'general',
        complexity: 'moderate'
      });
    });

    it('should use existing data when available', () => {
      const existingData = {
        title: 'My Project',
        description: 'My description',
        techStack: ['Python', 'Django'],
        features: ['ML', 'API']
      };

      const result = populator.getFallbackSuggestions(existingData);
      
      expect(result.title).toBe('My Project');
      expect(result.description).toBe('My description');
      expect(result.techStack).toEqual(['Python', 'Django']);
      expect(result.features).toEqual(['ML', 'API']);
      expect(result.domain).toBe('general');
      expect(result.complexity).toBe('moderate');
    });

    it('should handle partial existing data', () => {
      const existingData = {
        title: 'My Project'
        // Missing other fields
      };

      const result = populator.getFallbackSuggestions(existingData);
      
      expect(result.title).toBe('My Project');
      expect(result.description).toBe('A new project');
      expect(result.targetUsers).toEqual(['developers', 'end-users']);
      expect(result.techStack).toEqual(['JavaScript', 'Node.js']);
    });

    it('should handle empty existing data', () => {
      const result = populator.getFallbackSuggestions({});
      
      expect(result).toEqual({
        title: 'Untitled Project',
        description: 'A new project',
        targetUsers: ['developers', 'end-users'],
        techStack: ['JavaScript', 'Node.js'],
        features: ['Core functionality'],
        domain: 'general',
        complexity: 'moderate'
      });
    });
  });

  describe('extractJSON', () => {
    it('should extract JSON from code block with json language', () => {
      const content = 'Here is the result:\n```json\n{"key": "value", "number": 123}\n```';
      const result = populator.extractJSON(content);
      expect(result).toEqual({ key: 'value', number: 123 });
    });

    it('should extract JSON from code block without language', () => {
      const content = 'Response:\n```\n{"test": true, "items": [1, 2, 3]}\n```\nDone.';
      const result = populator.extractJSON(content);
      expect(result).toEqual({ test: true, items: [1, 2, 3] });
    });

    it('should extract raw JSON without code block', () => {
      const content = 'Response: {"key": "value", "nested": {"inner": true}}';
      const result = populator.extractJSON(content);
      expect(result).toEqual({ key: 'value', nested: { inner: true } });
    });

    it('should extract JSON with surrounding text', () => {
      const content = 'The analysis shows: {"result": "success", "score": 0.95} which is good.';
      const result = populator.extractJSON(content);
      expect(result).toEqual({ result: 'success', score: 0.95 });
    });

    it('should handle multiline JSON', () => {
      const content = `Result:
{
  "title": "Project",
  "features": [
    "Feature 1",
    "Feature 2"
  ]
}`;
      const result = populator.extractJSON(content);
      expect(result).toEqual({
        title: 'Project',
        features: ['Feature 1', 'Feature 2']
      });
    });

    it('should throw error when no JSON found', () => {
      const content = 'No JSON here, just plain text';
      expect(() => populator.extractJSON(content)).toThrow('No JSON found in response');
    });

    it('should throw error for invalid JSON', () => {
      const content = '{"invalid": json without quotes}';
      expect(() => populator.extractJSON(content)).toThrow();
    });

    it('should extract first valid JSON when multiple exist', () => {
      const content = '{"first": 1} some text {"second": 2}';
      const result = populator.extractJSON(content);
      expect(result).toEqual({ first: 1 });
    });

    it('should handle JSON with special characters', () => {
      const content = '```json\n{"text": "Line 1\\nLine 2", "path": "C:\\\\Users\\\\test"}\n```';
      const result = populator.extractJSON(content);
      expect(result).toEqual({ 
        text: 'Line 1\nLine 2',
        path: 'C:\\Users\\test'
      });
    });
  });
});