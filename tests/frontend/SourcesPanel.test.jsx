import React from 'react';
import { render, screen } from '@testing-library/react';
import { SourcesPanel } from '../../src/components/panels/SourcesPanel';

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

describe('SourcesPanel Component', () => {
  const mockAverageAgeTimeSeries = [
    {
      date: '2024-01-01',
      highAvgAge: 10,
      mediumAvgAge: 15,
      lowAvgAge: 20,
    },
    {
      date: '2024-01-02',
      highAvgAge: 12,
      mediumAvgAge: 16,
      lowAvgAge: 22,
    },
  ];

  const mockRealData = {
    averageAgeTimeSeries: mockAverageAgeTimeSeries,
    sourceLabels: ['src-bug-fix', 'src-feature'],
    tickets: [],
  };

  test('renders "Average Time in Top 7 Trends" instead of "Average Ticket Age Trends"', () => {
    render(
      <SourcesPanel 
        realData={mockRealData}
        jiraConfig={{ project: 'TEST' }}
        timePeriod="30d"
      />
    );

    // Should show new title
    expect(screen.getByText('Average Time in Top 7 Trends')).toBeInTheDocument();
    
    // Should NOT show old title
    expect(screen.queryByText('Average Ticket Age Trends')).not.toBeInTheDocument();
  });

  test('renders updated description for average time chart', () => {
    render(
      <SourcesPanel 
        realData={mockRealData}
        jiraConfig={{ project: 'TEST' }}
        timePeriod="30d"
      />
    );

    // Should show updated description
    expect(screen.getByText('Shows how the average time tickets have been in Top 7 changes over time by priority level.'))
      .toBeInTheDocument();
  });

  test('renders chart components when data is available', () => {
    render(
      <SourcesPanel 
        realData={mockRealData}
        jiraConfig={{ project: 'TEST' }}
        timePeriod="30d"
      />
    );

    // Check that chart containers are rendered (multiple charts may exist)
    const containers = screen.getAllByTestId('responsive-container');
    expect(containers.length).toBeGreaterThan(0);
    
    const charts = screen.getAllByTestId('line-chart');
    expect(charts.length).toBeGreaterThan(0);
  });

  test('handles null realData gracefully', () => {
    const { container } = render(
      <SourcesPanel 
        realData={null}
        jiraConfig={{ project: 'TEST' }}
        timePeriod="30d"
      />
    );

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  test('handles missing averageAgeTimeSeries data', () => {
    const dataWithoutTimeSeries = {
      ...mockRealData,
      averageAgeTimeSeries: null,
    };

    render(
      <SourcesPanel 
        realData={dataWithoutTimeSeries}
        jiraConfig={{ project: 'TEST' }}
        timePeriod="30d"
      />
    );

    // Should not render the average time chart section
    expect(screen.queryByText('Average Time in Top 7 Trends')).not.toBeInTheDocument();
  });
});