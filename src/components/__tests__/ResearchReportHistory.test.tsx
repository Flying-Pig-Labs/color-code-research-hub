import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import { ResearchReportHistory } from '../ResearchReportHistory';
import * as researchApi from '../../services/researchApi';

// Mock the researchApi module
vi.mock('../../services/researchApi');
const mockedResearchApi = researchApi as vi.Mocked<typeof researchApi>;

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === 'MMM dd, yyyy HH:mm') {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toString();
  })
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

const mockReports = [
  {
    reportId: 'report-1',
    team: 'red',
    createdAt: '2024-01-15T10:30:00Z',
    requestId: 'req-1',
    s3Key: 'reports/red_report_1.json',
    title: 'Competitive Analysis',
    vendorName: 'Competitor Corp',
    contentSummary: 'Comprehensive analysis of competitor strengths and weaknesses',
    downloadUrl: 'https://s3.amazonaws.com/bucket/report1.json',
    metadata: { wordCount: 1500 }
  },
  {
    reportId: 'report-2',
    team: 'white',
    createdAt: '2024-01-14T15:45:00Z',
    requestId: 'req-2',
    s3Key: 'reports/white_report_2.json',
    companyName: 'Innovation Inc',
    contentSummary: 'Market opportunity discovery in emerging tech sectors',
    downloadUrl: 'https://s3.amazonaws.com/bucket/report2.json',
    metadata: { wordCount: 2200 }
  },
  {
    reportId: 'report-3',
    team: 'black',
    createdAt: '2024-01-13T09:15:00Z',
    requestId: 'req-3',
    s3Key: 'reports/black_report_3.json',
    vendorName: 'Legacy Vendor',
    contentSummary: 'Technical vendor replacement analysis',
    downloadUrl: null, // No download URL available
    metadata: { wordCount: 3100 }
  }
];

describe('ResearchReportHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedResearchApi.listResearchReports.mockResolvedValue(mockReports);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      mockedResearchApi.listResearchReports.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ResearchReportHistory />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('should render reports table when data loads', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Competitive Analysis')).toBeInTheDocument();
      expect(screen.getByText('Innovation Inc')).toBeInTheDocument();
      expect(screen.getByText('Legacy Vendor')).toBeInTheDocument();
    });

    it('should display team badges with correct colors', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('RED')).toBeInTheDocument();
      });

      const redBadge = screen.getByText('RED');
      const whiteBadge = screen.getByText('WHITE');
      const blackBadge = screen.getByText('BLACK');

      expect(redBadge).toHaveClass('text-red-600');
      expect(whiteBadge).toHaveClass('text-gray-600');
      expect(blackBadge).toHaveClass('text-gray-900');
    });

    it('should show formatted dates', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 13, 2024/)).toBeInTheDocument();
    });
  });

  describe('Team Filtering', () => {
    it('should filter by red team when team prop is provided', async () => {
      render(<ResearchReportHistory team="red" />);

      await waitFor(() => {
        expect(mockedResearchApi.listResearchReports).toHaveBeenCalledWith('red', 20);
      });

      expect(screen.getByText('Research History')).toBeInTheDocument();
      expect(screen.getByText('(RED Team)')).toBeInTheDocument();
    });

    it('should filter by white team', async () => {
      render(<ResearchReportHistory team="white" />);

      await waitFor(() => {
        expect(mockedResearchApi.listResearchReports).toHaveBeenCalledWith('white', 20);
      });

      expect(screen.getByText('(WHITE Team)')).toBeInTheDocument();
    });

    it('should filter by black team', async () => {
      render(<ResearchReportHistory team="black" />);

      await waitFor(() => {
        expect(mockedResearchApi.listResearchReports).toHaveBeenCalledWith('black', 20);
      });

      expect(screen.getByText('(BLACK Team)')).toBeInTheDocument();
    });

    it('should respect custom limit prop', async () => {
      render(<ResearchReportHistory limit={10} />);

      await waitFor(() => {
        expect(mockedResearchApi.listResearchReports).toHaveBeenCalledWith(undefined, 10);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const errorMessage = 'Network error';
      mockedResearchApi.listResearchReports.mockRejectedValue(new Error(errorMessage));

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load research history')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should retry loading when retry button is clicked', async () => {
      mockedResearchApi.listResearchReports
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockReports);

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load research history')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      expect(mockedResearchApi.listResearchReports).toHaveBeenCalledTimes(2);
    });

    it('should show empty state when no reports are found', async () => {
      mockedResearchApi.listResearchReports.mockResolvedValue([]);

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('No research reports found')).toBeInTheDocument();
      });
    });

    it('should show team-specific empty state', async () => {
      mockedResearchApi.listResearchReports.mockResolvedValue([]);

      render(<ResearchReportHistory team="red" />);

      await waitFor(() => {
        expect(screen.getByText('No research reports found for red team')).toBeInTheDocument();
      });
    });
  });

  describe('Download Functionality', () => {
    // Mock DOM methods for download testing
    const mockCreateElement = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockClick = vi.fn();

    beforeEach(() => {
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };

      mockCreateElement.mockReturnValue(mockLink);
      
      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      });
    });

    it('should download report when download button is clicked', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      const firstDownloadButton = downloadButtons[0];

      expect(firstDownloadButton).not.toBeDisabled();

      fireEvent.click(firstDownloadButton);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should disable download button when no download URL is available', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      const disabledButton = downloadButtons.find(button => button.hasAttribute('disabled'));

      expect(disabledButton).toBeInTheDocument();
      expect(disabledButton).toHaveClass('bg-gray-400', 'cursor-not-allowed');
    });

    it('should show error toast when download URL is not available', async () => {
      const { toast } = await import('sonner');

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      const disabledButton = downloadButtons.find(button => button.hasAttribute('disabled'));

      fireEvent.click(disabledButton!);

      expect(toast.error).toHaveBeenCalledWith('Download not available for this report');
    });

    it('should show success toast on successful download', async () => {
      const { toast } = await import('sonner');

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      const enabledButton = downloadButtons.find(button => !button.hasAttribute('disabled'));

      fireEvent.click(enabledButton!);

      expect(toast.success).toHaveBeenCalledWith('Download started');
    });
  });

  describe('Data Display', () => {
    it('should display correct target information', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Competitor Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Innovation Inc')).toBeInTheDocument();
      expect(screen.getByText('Legacy Vendor')).toBeInTheDocument();
    });

    it('should display content summaries', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText(/Comprehensive analysis of competitor/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Market opportunity discovery/)).toBeInTheDocument();
      expect(screen.getByText(/Technical vendor replacement/)).toBeInTheDocument();
    });

    it('should truncate long summaries', async () => {
      const longSummaryReport = {
        ...mockReports[0],
        contentSummary: 'A'.repeat(500) // Very long summary
      };

      mockedResearchApi.listResearchReports.mockResolvedValue([longSummaryReport]);

      render(<ResearchReportHistory />);

      await waitFor(() => {
        const summaryCell = screen.getByRole('cell', { name: /AAAA/ });
        expect(summaryCell).toHaveClass('truncate');
      });
    });

    it('should show fallback text for missing data', async () => {
      const incompleteReport = {
        reportId: 'incomplete',
        team: 'red',
        createdAt: '2024-01-15T10:30:00Z',
        requestId: 'req-incomplete',
        s3Key: 'reports/incomplete.json',
        // Missing title, vendorName, companyName
        contentSummary: null
      };

      mockedResearchApi.listResearchReports.mockResolvedValue([incompleteReport]);

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });

      expect(screen.getByText('No summary available')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button is clicked', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockedResearchApi.listResearchReports).toHaveBeenCalledTimes(2);
    });

    it('should show loading state during refresh', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      // Mock a slow refresh
      mockedResearchApi.listResearchReports.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockReports), 1000))
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Should show loading state
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(5);
      expect(columnHeaders[0]).toHaveTextContent('Date');
      expect(columnHeaders[1]).toHaveTextContent('Team');
      expect(columnHeaders[2]).toHaveTextContent('Target');
      expect(columnHeaders[3]).toHaveTextContent('Summary');
      expect(columnHeaders[4]).toHaveTextContent('Actions');
    });

    it('should have accessible loading spinner', () => {
      mockedResearchApi.listResearchReports.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ResearchReportHistory />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', expect.stringMatching(/loading/i));
    });

    it('should have proper button labels', async () => {
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });
});