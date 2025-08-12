const { handler } = require('../health');

describe('health handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Mock the date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
  });

  it('should return healthy status with production environment by default', async () => {
    const event = {};
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    });
    
    const body = JSON.parse(response.body);
    expect(body).toEqual({
      status: 'healthy',
      environment: 'production',
      timestamp: '2024-01-01T12:00:00.000Z'
    });
  });

  it('should use ENVIRONMENT variable when set', async () => {
    process.env = { ...originalEnv, ENVIRONMENT: 'development' };
    
    const event = {};
    const response = await handler(event);
    
    const body = JSON.parse(response.body);
    expect(body.environment).toBe('development');
  });

  it('should include current timestamp', async () => {
    const event = {};
    
    // First call
    const response1 = await handler(event);
    const body1 = JSON.parse(response1.body);
    expect(body1.timestamp).toBe('2024-01-01T12:00:00.000Z');
    
    // Advance time
    vi.advanceTimersByTime(5000);
    
    // Second call
    const response2 = await handler(event);
    const body2 = JSON.parse(response2.body);
    expect(body2.timestamp).toBe('2024-01-01T12:00:05.000Z');
  });

  it('should always return 200 status code', async () => {
    // Test with various event objects
    const testEvents = [
      {},
      { body: 'test' },
      { httpMethod: 'POST' },
      { headers: { 'X-Custom': 'value' } },
      null,
      undefined
    ];
    
    for (const event of testEvents) {
      const response = await handler(event);
      expect(response.statusCode).toBe(200);
    }
  });

  it('should include proper CORS headers', async () => {
    const event = {};
    const response = await handler(event);
    
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Headers']).toContain('Content-Type');
    expect(response.headers['Access-Control-Allow-Headers']).toContain('X-Api-Key');
    expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
    expect(response.headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
  });

  it('should return valid JSON body', async () => {
    const event = {};
    const response = await handler(event);
    
    // Should not throw when parsing
    expect(() => JSON.parse(response.body)).not.toThrow();
    
    const body = JSON.parse(response.body);
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  it('should handle environment with special characters', async () => {
    process.env = { ...originalEnv, ENVIRONMENT: 'test-env_123.special' };
    
    const event = {};
    const response = await handler(event);
    
    const body = JSON.parse(response.body);
    expect(body.environment).toBe('test-env_123.special');
  });
});