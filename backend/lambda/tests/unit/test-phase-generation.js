const test = require('node:test');
const assert = require('node:assert');
const { PHASE_GENERATOR_PROMPT, PHASE_ROLE_MAPPING } = require('../../handlers/prompts');

test('Phase Generation Prompt Tests', async (t) => {
  await t.test('prompt includes all 8 standard phases', () => {
    assert.ok(PHASE_GENERATOR_PROMPT.includes('1. Discovery & Requirements'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('2. Technical Planning & Architecture'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('3. UI/UX Design & Prototyping'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('4. Core Development'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('5. System Integration & Testing'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('6. Quality Assurance & Testing'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('7. Deployment & Distribution'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('8. Launch & Documentation'));
  });
  
  await t.test('prompt includes domain and README placeholders', () => {
    assert.ok(PHASE_GENERATOR_PROMPT.includes('{domain}'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('{readmeContent}'));
  });
  
  await t.test('prompt specifies JSON structure', () => {
    assert.ok(PHASE_GENERATOR_PROMPT.includes('"phases"'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('"id"'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('"title"'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('"description"'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('"suggestedRoles"'));
  });
});

test('Phase Role Mapping Tests', async (t) => {
  await t.test('all phases have role mappings', () => {
    const expectedPhases = [
      'discovery',
      'technical_planning',
      'design',
      'core_development',
      'integration',
      'quality_assurance',
      'deployment',
      'launch'
    ];
    
    expectedPhases.forEach(phase => {
      assert.ok(PHASE_ROLE_MAPPING[phase], `Phase ${phase} should have role mapping`);
      assert.ok(Array.isArray(PHASE_ROLE_MAPPING[phase]), `Phase ${phase} roles should be an array`);
      assert.ok(PHASE_ROLE_MAPPING[phase].length > 0, `Phase ${phase} should have at least one role`);
    });
  });
  
  await t.test('discovery phase has correct roles', () => {
    const discoveryRoles = PHASE_ROLE_MAPPING.discovery;
    assert.ok(discoveryRoles.includes('Product Owner'));
    assert.ok(discoveryRoles.includes('UX Researcher'));
    assert.ok(discoveryRoles.includes('Business Analyst'));
    assert.ok(discoveryRoles.includes('Technical Lead'));
  });
  
  await t.test('technical planning phase has correct roles', () => {
    const techRoles = PHASE_ROLE_MAPPING.technical_planning;
    assert.ok(techRoles.includes('Software Architect'));
    assert.ok(techRoles.includes('Technical Lead'));
    assert.ok(techRoles.includes('DevOps Engineer'));
    assert.ok(techRoles.includes('Security Engineer'));
  });
  
  await t.test('core development phase has correct roles', () => {
    const devRoles = PHASE_ROLE_MAPPING.core_development;
    assert.ok(devRoles.includes('Software Engineer'));
    assert.ok(devRoles.includes('Backend Developer'));
    assert.ok(devRoles.includes('Frontend Developer'));
    assert.ok(devRoles.includes('Database Engineer'));
  });
});

test('Phase Generation Logic Tests', async (t) => {
  // Simulate the phase generation logic
  const generatePhaseId = (title) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
  };
  
  await t.test('generates valid phase IDs', () => {
    assert.strictEqual(generatePhaseId('Discovery & Requirements'), 'discovery_requiremen');
    assert.strictEqual(generatePhaseId('Technical Planning & Architecture'), 'technical_planning_a');
    assert.strictEqual(generatePhaseId('UI/UX Design & Prototyping'), 'uiux_design_prototyp');
    assert.strictEqual(generatePhaseId('Core Development'), 'core_development');
  });
  
  await t.test('phase structure validation', () => {
    const validPhase = {
      id: 'discovery',
      title: 'Discovery & Requirements',
      description: 'Initial project analysis and requirement gathering',
      suggestedRoles: ['Product Owner', 'UX Researcher']
    };
    
    // Validate required fields
    assert.ok(validPhase.id);
    assert.ok(validPhase.title);
    assert.ok(validPhase.description);
    assert.ok(Array.isArray(validPhase.suggestedRoles));
    assert.ok(validPhase.suggestedRoles.length > 0);
  });
});

test('Phase Customization Tests', async (t) => {
  await t.test('mobile app phases should split development', () => {
    // Test that the prompt mentions mobile-specific considerations
    assert.ok(PHASE_GENERATOR_PROMPT.includes('mobile apps'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('API Development'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('Mobile Development'));
  });
  
  await t.test('enterprise software phases should emphasize security', () => {
    assert.ok(PHASE_GENERATOR_PROMPT.includes('enterprise software'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('security'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('compliance'));
  });
  
  await t.test('consumer product phases should focus on UX', () => {
    assert.ok(PHASE_GENERATOR_PROMPT.includes('consumer products'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('UX'));
    assert.ok(PHASE_GENERATOR_PROMPT.includes('marketing'));
  });
});