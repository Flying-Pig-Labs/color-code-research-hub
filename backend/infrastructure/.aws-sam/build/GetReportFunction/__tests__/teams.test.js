const { handler } = require('../teams');

describe('teams handler', () => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS request for CORS', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/teams'
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual(corsHeaders);
      expect(response.body).toBe('');
    });
  });

  describe('GET /teams', () => {
    it('should return list of team types', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/teams'
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual(corsHeaders);
      expect(JSON.parse(response.body)).toEqual(['red', 'black', 'white']);
    });
  });

  describe('GET /teams/:teamType/fields', () => {
    it('should return red team fields', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/teams/red/fields'
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual(corsHeaders);
      
      const fields = JSON.parse(response.body);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
      
      // Check for required red team fields
      const fieldNames = fields.map(f => f.name);
      expect(fieldNames).toContain('objective');
      expect(fieldNames).toContain('scope');
      expect(fieldNames).toContain('methodology');
      expect(fieldNames).toContain('targetSystems');
      
      // Check field structure
      const objectiveField = fields.find(f => f.name === 'objective');
      expect(objectiveField).toMatchObject({
        name: 'objective',
        label: 'Red Team Objective',
        type: 'textarea',
        required: true
      });
    });

    it('should return black team fields', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/teams/black/fields'
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual(corsHeaders);
      
      const fields = JSON.parse(response.body);
      expect(Array.isArray(fields)).toBe(true);
      
      // Check for required black team fields
      const fieldNames = fields.map(f => f.name);
      expect(fieldNames).toContain('vendorName');
      expect(fieldNames).toContain('productName');
      expect(fieldNames).toContain('analysisType');
      expect(fieldNames).toContain('priority');
      
      // Check select field options
      const analysisTypeField = fields.find(f => f.name === 'analysisType');
      expect(analysisTypeField.options).toEqual([
        'Vulnerability Research',
        'Exploit Development',
        'Patch Analysis',
        'Full Assessment'
      ]);
    });

    it('should return white team fields', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/teams/white/fields'
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual(corsHeaders);
      
      const fields = JSON.parse(response.body);
      expect(Array.isArray(fields)).toBe(true);
      
      // Check for required white team fields
      const fieldNames = fields.map(f => f.name);
      expect(fieldNames).toContain('whitespaceType');
      expect(fieldNames).toContain('targetMarket');
      expect(fieldNames).toContain('timeframe');
      expect(fieldNames).toContain('deliverables');
      
      // Check timeframe options
      const timeframeField = fields.find(f => f.name === 'timeframe');
      expect(timeframeField.options).toContain('Immediate (1-3 months)');
      expect(timeframeField.options).toContain('Long-term (12+ months)');
    });

    it('should return 404 for unknown team type', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/teams/purple/fields'
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(404);
      expect(response.headers).toEqual(corsHeaders);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Team type not found'
      });
    });
  });

  describe('Unknown endpoints', () => {
    it('should return 404 for unknown endpoint', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/unknown'
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(404);
      expect(response.headers).toEqual(corsHeaders);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Endpoint not found'
      });
    });

    it('should return 404 for POST request to /teams', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/teams',
        body: JSON.stringify({ test: 'data' })
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(404);
      expect(response.headers).toEqual(corsHeaders);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Endpoint not found'
      });
    });

    it('should handle paths with trailing slashes', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/teams/'
      };
      
      const response = await handler(event);
      
      // Should return 404 as it doesn't match exactly
      expect(response.statusCode).toBe(404);
    });
  });

  describe('Field validation', () => {
    it('should have consistent field structure for all teams', async () => {
      const teamTypes = ['red', 'black', 'white'];
      
      for (const team of teamTypes) {
        const event = {
          httpMethod: 'GET',
          path: `/teams/${team}/fields`
        };
        
        const response = await handler(event);
        const fields = JSON.parse(response.body);
        
        // All fields should have required properties
        fields.forEach(field => {
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('label');
          expect(field).toHaveProperty('type');
          expect(field).toHaveProperty('required');
          
          // Validate field types
          expect(['text', 'textarea', 'select']).toContain(field.type);
          
          // If select type, should have options
          if (field.type === 'select') {
            expect(field).toHaveProperty('options');
            expect(Array.isArray(field.options)).toBe(true);
            expect(field.options.length).toBeGreaterThan(0);
          }
        });
      }
    });
  });
});