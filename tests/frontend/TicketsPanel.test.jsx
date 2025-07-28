import React from 'react';
import { render, screen } from '@testing-library/react';
import { TicketsPanel } from '../../src/components/panels/TicketsPanel';

describe('TicketsPanel Component', () => {
  const mockJiraConfig = {
    baseUrl: 'https://test.atlassian.net',
    project: 'TEST',
  };

  const mockTickets = [
    {
      key: 'TEST-1',
      summary: 'High priority ticket',
      status: 'In Progress',
      currentStatus: { value: 'In Progress', lastChangedBy: 'user1' },
      priorityLevel: 5,
      currentPriorityLevel: { value: 5, lastChangedBy: 'user2' },
      ageInDays: 20,
      timeInTop7Days: 15,
      incomingDate: '2024-01-05T00:00:00.000Z',
      created: '2024-01-01T00:00:00.000Z'
    },
    {
      key: 'TEST-2',
      summary: 'Medium priority ticket',
      status: 'Open',
      currentStatus: { value: 'Open' },
      priorityLevel: 50,
      currentPriorityLevel: { value: 50 },
      ageInDays: 10,
      timeInTop7Days: 8,
      incomingDate: '2024-01-12T00:00:00.000Z',
      created: '2024-01-10T00:00:00.000Z'
    },
  ];

  test('renders "Time in Top 7" header instead of "Age (Days)"', () => {
    render(
      <TicketsPanel 
        realData={{ tickets: mockTickets }}
        jiraConfig={mockJiraConfig}
        timePeriod="30d"
      />
    );

    // Should show "Time in Top 7" header
    expect(screen.getByText('Time in Top 7')).toBeInTheDocument();
    
    // Should NOT show "Age (Days)" header
    expect(screen.queryByText('Age (Days)')).not.toBeInTheDocument();
  });

  test('displays timeInTop7Days values with "d" suffix', () => {
    render(
      <TicketsPanel 
        realData={{ tickets: mockTickets }}
        jiraConfig={mockJiraConfig}
        timePeriod="30d"
      />
    );

    // Check that time values are displayed correctly
    expect(screen.getByText('15d')).toBeInTheDocument(); // TEST-1
    expect(screen.getByText('8d')).toBeInTheDocument();  // TEST-2
  });

  test('sorts tickets by timeInTop7Days in descending order', () => {
    render(
      <TicketsPanel 
        realData={{ tickets: mockTickets }}
        jiraConfig={mockJiraConfig}
        timePeriod="30d"
      />
    );

    const rows = screen.getAllByRole('row');
    // First row is header, so ticket rows start at index 1
    
    // TEST-1 should come first (15 days > 8 days)
    expect(rows[1]).toHaveTextContent('TEST-1');
    expect(rows[1]).toHaveTextContent('15d');
    
    // TEST-2 should come second
    expect(rows[2]).toHaveTextContent('TEST-2');
    expect(rows[2]).toHaveTextContent('8d');
  });

  test('falls back to ageInDays if timeInTop7Days is not available', () => {
    const ticketsWithoutTimeInTop7 = [{
      ...mockTickets[0],
      timeInTop7Days: undefined
    }];

    render(
      <TicketsPanel 
        realData={{ tickets: ticketsWithoutTimeInTop7 }}
        jiraConfig={mockJiraConfig}
        timePeriod="30d"
      />
    );

    // Should fall back to ageInDays (20)
    expect(screen.getByText('20d')).toBeInTheDocument();
  });

  test('handles empty ticket list gracefully', () => {
    render(
      <TicketsPanel 
        realData={{ tickets: [] }}
        jiraConfig={mockJiraConfig}
        timePeriod="30d"
      />
    );

    // Should still render headers
    expect(screen.getByText('Time in Top 7')).toBeInTheDocument();
    
    // But no ticket rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(1); // Only header row
  });

  test('handles null realData gracefully', () => {
    const { container } = render(
      <TicketsPanel 
        realData={null}
        jiraConfig={mockJiraConfig}
        timePeriod="30d"
      />
    );

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });
});