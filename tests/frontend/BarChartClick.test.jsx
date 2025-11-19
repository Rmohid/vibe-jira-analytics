import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FixedTicketsPanel } from '../../src/components/panels/FixedTicketsPanel';
import { SourcesPanel } from '../../src/components/panels/SourcesPanel';

// Mock Recharts components
jest.mock('recharts', () => ({
    BarChart: ({ children, onClick }) => (
        <div data-testid="bar-chart" onClick={() => onClick && onClick({ 
            activePayload: [{ dataKey: 'src-bug-fix', value: 5, color: '#ff0000' }],
            activeLabel: '2024-01-15'
        })}>
            {children}
        </div>
    ),
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Bar: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('Bar Chart Click Interactions', () => {
    const mockRealData = {
        fixedTicketsTimeSeries: [
            {
                date: '2024-01-15',
                'src-bug-fix': 5,
                'src-new-feature': 3
            }
        ],
        sourceLabels: [
            { label: 'src-bug-fix', name: 'Bug Fix', color: '#ff0000', count: 5, percentage: 50 },
            { label: 'src-new-feature', name: 'New Feature', color: '#00ff00', count: 3, percentage: 30 }
        ],
        sourceLabelsTimeSeries: [
            {
                date: '2024-01-15',
                'src-bug-fix': 5,
                'src-bug-fix_tickets': ['TEST-1', 'TEST-2', 'TEST-3'],
                'src-new-feature': 3,
                'src-new-feature_tickets': ['TEST-4', 'TEST-5']
            }
        ],
        tickets: [
            {
                key: 'TEST-1',
                summary: 'Test ticket 1',
                isOutgoing: true,
                outgoingDate: '2024-01-15T10:00:00Z',
                sourceLabels: ['src-bug-fix']
            },
            {
                key: 'TEST-2',
                summary: 'Test ticket 2',
                isOutgoing: true,
                outgoingDate: '2024-01-15T11:00:00Z',
                sourceLabels: ['src-bug-fix']
            }
        ]
    };

    const mockJiraConfig = {
        baseUrl: 'https://test.atlassian.net',
        project: 'TEST'
    };

    describe('FixedTicketsPanel', () => {
        test('opens modal when bar chart is clicked', () => {
            render(
                <FixedTicketsPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                    timeInterval="daily"
                />
            );

            // Click on the bar chart
            const barChart = screen.getByTestId('bar-chart');
            fireEvent.click(barChart);

            // Modal should appear with the date in the title
            expect(screen.getByText(/Fixed Tickets - 2024-01-15/)).toBeInTheDocument();
        });

        test('closes modal when close button is clicked', () => {
            render(
                <FixedTicketsPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                    timeInterval="daily"
                />
            );

            // Click on the bar chart to open modal
            const barChart = screen.getByTestId('bar-chart');
            fireEvent.click(barChart);

            // Modal should be open
            expect(screen.getByText(/Fixed Tickets - 2024-01-15/)).toBeInTheDocument();

            // Click close button
            const closeButton = screen.getByLabelText('Close');
            fireEvent.click(closeButton);

            // Modal should be closed
            expect(screen.queryByText(/Fixed Tickets - 2024-01-15/)).not.toBeInTheDocument();
        });

        test('displays instruction to click bar', () => {
            render(
                <FixedTicketsPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                    timeInterval="daily"
                />
            );

            // Should show instruction to click bar
            expect(screen.getByText(/Click on a bar to see full details/)).toBeInTheDocument();
        });
    });

    describe('SourcesPanel', () => {
        test('opens modal when bar chart is clicked', () => {
            render(
                <SourcesPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                />
            );

            // Click on the bar chart
            const barChart = screen.getByTestId('bar-chart');
            fireEvent.click(barChart);

            // Modal should appear with the date in the title
            expect(screen.getByText(/Source Label Occurrences - 2024-01-15/)).toBeInTheDocument();
        });

        test('closes modal when close button is clicked', () => {
            render(
                <SourcesPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                />
            );

            // Click on the bar chart to open modal
            const barChart = screen.getByTestId('bar-chart');
            fireEvent.click(barChart);

            // Modal should be open
            expect(screen.getByText(/Source Label Occurrences - 2024-01-15/)).toBeInTheDocument();

            // Click close button
            const closeButton = screen.getByLabelText('Close');
            fireEvent.click(closeButton);

            // Modal should be closed
            expect(screen.queryByText(/Source Label Occurrences - 2024-01-15/)).not.toBeInTheDocument();
        });

        test('displays instruction to click bar', () => {
            render(
                <SourcesPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                />
            );

            // Should show instruction to click bar
            expect(screen.getByText(/Click on a bar to see full details/)).toBeInTheDocument();
        });
    });
});
