import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FixedTicketsPanel } from '../../src/components/panels/FixedTicketsPanel';
import { SourcesPanel } from '../../src/components/panels/SourcesPanel';

// Mock window.open
const mockWindowOpen = jest.fn();
global.window.open = mockWindowOpen;

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
    beforeEach(() => {
        // Clear mock before each test
        mockWindowOpen.mockClear();
        // Mock the new window object that window.open returns
        const mockNewWindow = {
            document: {
                write: jest.fn(),
                close: jest.fn()
            }
        };
        mockWindowOpen.mockReturnValue(mockNewWindow);
    });
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
        test('opens new tab when bar chart is clicked', () => {
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

            // window.open should have been called
            expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
            
            // The new window should have received HTML content
            const mockNewWindow = mockWindowOpen.mock.results[0].value;
            expect(mockNewWindow.document.write).toHaveBeenCalled();
            const htmlContent = mockNewWindow.document.write.mock.calls[0][0];
            
            // Verify the HTML content contains expected information
            expect(htmlContent).toContain('Fixed Tickets');
            expect(htmlContent).toContain('2024-01-15');
        });

        test('displays instruction to click bar for new tab', () => {
            render(
                <FixedTicketsPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                    timeInterval="daily"
                />
            );

            // Should show instruction to click bar for new tab
            expect(screen.getByText(/Click on a bar to open details in new tab/)).toBeInTheDocument();
        });
    });

    describe('SourcesPanel', () => {
        test('opens new tab when bar chart is clicked', () => {
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

            // window.open should have been called
            expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
            
            // The new window should have received HTML content
            const mockNewWindow = mockWindowOpen.mock.results[0].value;
            expect(mockNewWindow.document.write).toHaveBeenCalled();
            const htmlContent = mockNewWindow.document.write.mock.calls[0][0];
            
            // Verify the HTML content contains expected information
            expect(htmlContent).toContain('Source Label Occurrences');
            expect(htmlContent).toContain('2024-01-15');
        });

        test('displays instruction to click bar for new tab', () => {
            render(
                <SourcesPanel
                    realData={mockRealData}
                    jiraConfig={mockJiraConfig}
                    timePeriod="30d"
                />
            );

            // Should show instruction to click bar for new tab
            expect(screen.getByText(/Click on a bar to open details in new tab/)).toBeInTheDocument();
        });
    });
});
