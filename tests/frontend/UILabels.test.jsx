import React from 'react';
import { render, screen } from '@testing-library/react';
import { TicketsPanel } from '../../src/components/panels/TicketsPanel';
import { SourcesPanel } from '../../src/components/panels/SourcesPanel';
import { OverviewPanel } from '../../src/components/panels/OverviewPanel';

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('UI Labels - Time in Top 7 Updates', () => {
  const mockJiraConfig = {
    baseUrl: 'https://test.atlassian.net',
    project: 'KSD',
  };

  const mockTickets = [
    {
      key: 'KSD-1',
      summary: 'Test ticket',
      status: 'In Progress',
      currentStatus: { value: 'In Progress' },
      priorityLevel: 5,
      currentPriorityLevel: { value: 5 },
      ageInDays: 20,
      timeInTop7Days: 15,
      fields: { customfield_11129: 5 }
    }
  ];

  const mockRealData = {
    tickets: mockTickets,
    averageAgeTimeSeries: [
      { date: '2024-01-01', highAvgAge: 10, mediumAvgAge: 15, lowAvgAge: 20 }
    ],
    sourceLabels: ['src-bug-fix']
  };

  describe('TicketsPanel UI Labels', () => {
    test('should show "Time in Top 7" and NOT "Age (Days)"', () => {
      render(
        <TicketsPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      // Should show correct label
      expect(screen.getByText('Time in Top 7')).toBeInTheDocument();
      
      // Should NOT show old labels
      expect(screen.queryByText('Age (Days)')).not.toBeInTheDocument();
      expect(screen.queryByText('Age')).not.toBeInTheDocument();
    });

    test('should show time values with "d" suffix', () => {
      render(
        <TicketsPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      // Should show formatted time value
      expect(screen.getByText('15d')).toBeInTheDocument();
    });
  });

  describe('SourcesPanel UI Labels', () => {
    test('should show "Average Time in Top 7 Trends" and NOT "Average Ticket Age Trends"', () => {
      render(
        <SourcesPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      // Should show correct label
      expect(screen.getByText('Average Time in Top 7 Trends')).toBeInTheDocument();
      
      // Should NOT show old labels
      expect(screen.queryByText('Average Ticket Age Trends')).not.toBeInTheDocument();
      expect(screen.queryByText('Average Age Trends')).not.toBeInTheDocument();
    });

    test('should show updated description', () => {
      render(
        <SourcesPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      // Should show updated description
      expect(screen.getByText(/average time tickets have been in Top 7/)).toBeInTheDocument();
    });
  });

  describe('Overview Panel Integration', () => {
    test('should not contain any "Maximum Age" references', () => {
      render(
        <OverviewPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      // Should NOT show old "Maximum Age" anywhere in the component
      expect(screen.queryByText(/Maximum Age/)).not.toBeInTheDocument();
      
      // The actual maximum age display is in tooltips, which require hover to show
      // But we can verify the component renders without the old text
    });
  });

  describe('Comprehensive Label Check', () => {
    test('should not have any remaining "Age (Days)" references across all panels', () => {
      const { container: ticketsContainer } = render(
        <TicketsPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      const { container: sourcesContainer } = render(
        <SourcesPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      const { container: overviewContainer } = render(
        <OverviewPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );

      // Check that none of the containers have "Age (Days)" text
      expect(ticketsContainer.textContent).not.toMatch(/Age \(Days\)/);
      expect(sourcesContainer.textContent).not.toMatch(/Age \(Days\)/);
      expect(overviewContainer.textContent).not.toMatch(/Age \(Days\)/);
    });

    test('should have "Time in Top 7" references in appropriate places', () => {
      // TicketsPanel should have "Time in Top 7" header
      render(
        <TicketsPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );
      expect(screen.getByText('Time in Top 7')).toBeInTheDocument();

      // SourcesPanel should have "Average Time in Top 7 Trends"
      const { unmount } = render(
        <SourcesPanel 
          realData={mockRealData}
          jiraConfig={mockJiraConfig}
          timePeriod="30d"
        />
      );
      expect(screen.getByText('Average Time in Top 7 Trends')).toBeInTheDocument();
    });
  });
});