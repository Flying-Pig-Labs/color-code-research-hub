import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResearchSwarmForm } from '../ResearchSwarmForm';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/services/api', () => ({
  apiService: {
    submitResearch: vi.fn(),
    pollJobCompletion: vi.fn(),
  },
  showApiError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('ResearchSwarmForm', () => {
  const mockFields = [
    { name: 'objective', label: 'Research Objective', type: 'text', required: true },
    { name: 'scope', label: 'Scope', type: 'select', options: ['narrow', 'broad'], required: true },
    { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render form fields correctly', () => {
    render(<ResearchSwarmForm teamType="red" fields={mockFields} />);

    expect(screen.getByLabelText(/Research Objective/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Scope/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Additional Notes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    render(<ResearchSwarmForm teamType="red" fields={mockFields} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/This field is required/)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockJobId = 'job-123';
    const mockResult = { data: 'Research complete' };

    (apiService.submitResearch as any).mockResolvedValue({ jobId: mockJobId });
    (apiService.pollJobCompletion as any).mockResolvedValue(mockResult);

    render(<ResearchSwarmForm teamType="red" fields={mockFields} />);

    // Fill form
    await user.type(screen.getByLabelText(/Research Objective/), 'Test objective');
    await user.selectOptions(screen.getByLabelText(/Scope/), 'broad');
    await user.type(screen.getByLabelText(/Additional Notes/), 'Test notes');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiService.submitResearch).toHaveBeenCalledWith({
        teamType: 'red',
        fields: {
          objective: 'Test objective',
          scope: 'broad',
          notes: 'Test notes',
        },
      });
    });

    expect(toast.loading).toHaveBeenCalledWith(
      expect.stringContaining('Submitting research request'),
      expect.any(Object)
    );

    await waitFor(() => {
      expect(apiService.pollJobCompletion).toHaveBeenCalledWith(
        mockJobId,
        expect.any(Function)
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Research completed!',
        expect.any(Object)
      );
    });
  });

  it('should handle submission errors gracefully', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Submission failed');

    (apiService.submitResearch as any).mockRejectedValue(mockError);

    render(<ResearchSwarmForm teamType="red" fields={mockFields} />);

    // Fill form
    await user.type(screen.getByLabelText(/Research Objective/), 'Test objective');
    await user.selectOptions(screen.getByLabelText(/Scope/), 'broad');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to submit research request',
        expect.any(Object)
      );
    });

    expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
  });

  it('should disable form while submitting', async () => {
    const user = userEvent.setup();

    // Mock a slow submission
    (apiService.submitResearch as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<ResearchSwarmForm teamType="red" fields={mockFields} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/Research Objective/), 'Test');
    await user.selectOptions(screen.getByLabelText(/Scope/), 'broad');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Check that button is disabled
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/submitting/i);

    // Check that form fields are disabled
    expect(screen.getByLabelText(/Research Objective/)).toBeDisabled();
    expect(screen.getByLabelText(/Scope/)).toBeDisabled();
  });

  it('should save form data to localStorage', async () => {
    const user = userEvent.setup();

    render(<ResearchSwarmForm teamType="red" fields={mockFields} />);

    await user.type(screen.getByLabelText(/Research Objective/), 'Test objective');
    await user.selectOptions(screen.getByLabelText(/Scope/), 'broad');

    // Wait for debounced save
    await waitFor(() => {
      const saved = localStorage.getItem('researchTasks');
      expect(saved).toBeTruthy();
      
      if (saved) {
        const tasks = JSON.parse(saved);
        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toMatchObject({
          teamType: 'red',
          objective: 'Test objective',
          scope: 'broad',
          status: 'draft',
        });
      }
    });
  });

  it('should handle different field types correctly', () => {
    const complexFields = [
      { name: 'text', label: 'Text Field', type: 'text', required: true },
      { name: 'number', label: 'Number Field', type: 'number', required: false },
      { name: 'select', label: 'Select Field', type: 'select', options: ['a', 'b'], required: true },
      { name: 'textarea', label: 'Textarea Field', type: 'textarea', required: false },
      { name: 'checkbox', label: 'Checkbox Field', type: 'checkbox', required: false },
    ];

    render(<ResearchSwarmForm teamType="black" fields={complexFields} />);

    // Check all field types are rendered
    expect(screen.getByRole('textbox', { name: /Text Field/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /Number Field/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Select Field/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Textarea Field/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Checkbox Field/i })).toBeInTheDocument();
  });

  it('should show progress updates during job polling', async () => {
    const user = userEvent.setup();
    const mockJobId = 'job-123';
    let progressCallback: ((status: any) => void) | undefined;

    (apiService.submitResearch as any).mockResolvedValue({ jobId: mockJobId });
    (apiService.pollJobCompletion as any).mockImplementation((jobId, onProgress) => {
      progressCallback = onProgress;
      return new Promise(resolve => {
        setTimeout(() => resolve({ data: 'Complete' }), 100);
      });
    });

    render(<ResearchSwarmForm teamType="red" fields={mockFields} />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/Research Objective/), 'Test');
    await user.selectOptions(screen.getByLabelText(/Scope/), 'broad');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Simulate progress updates
    await waitFor(() => {
      expect(progressCallback).toBeDefined();
    });

    if (progressCallback) {
      progressCallback({ status: 'processing', jobId: mockJobId });
      
      await waitFor(() => {
        expect(toast.loading).toHaveBeenCalledWith(
          expect.stringContaining('Research in progress'),
          expect.objectContaining({
            id: 'toast-id',
          })
        );
      });
    }
  });

  it('should handle empty options for select fields', () => {
    const fieldsWithEmptyOptions = [
      { name: 'select', label: 'Select Field', type: 'select', options: [], required: true },
    ];

    render(<ResearchSwarmForm teamType="white" fields={fieldsWithEmptyOptions} />);

    const selectField = screen.getByRole('combobox', { name: /Select Field/i });
    expect(selectField).toBeInTheDocument();
    expect(selectField.children).toHaveLength(1); // Only placeholder option
  });
});