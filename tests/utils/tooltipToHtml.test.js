import { generateSourceLabelsHtml, generateFixedTicketsHtml, openHtmlInNewTab } from '../../src/utils/tooltipToHtml';

describe('tooltipToHtml utilities', () => {
    const mockJiraConfig = {
        baseUrl: 'https://test.atlassian.net'
    };

    describe('generateSourceLabelsHtml', () => {
        test('generates valid HTML with correct title and date', () => {
            const payload = [
                { dataKey: 'src-bug-fix', name: 'Bug Fix', value: 3, color: '#ff0000' }
            ];
            const realData = {
                sourceLabelsTimeSeries: [
                    {
                        date: '2024-01-15',
                        'src-bug-fix': 3,
                        'src-bug-fix_tickets': ['TEST-1', 'TEST-2', 'TEST-3']
                    }
                ]
            };

            const html = generateSourceLabelsHtml('2024-01-15', payload, realData, mockJiraConfig);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<title>Source Label Occurrences - 2024-01-15</title>');
            expect(html).toContain('Source Label Occurrences');
            expect(html).toContain('Date: 2024-01-15');
            expect(html).toContain('Bug Fix: 3 tickets');
            expect(html).toContain('TEST-1');
            expect(html).toContain('TEST-2');
            expect(html).toContain('TEST-3');
        });

        test('includes correct Jira links', () => {
            const payload = [
                { dataKey: 'src-bug-fix', name: 'Bug Fix', value: 1, color: '#ff0000' }
            ];
            const realData = {
                sourceLabelsTimeSeries: [
                    {
                        date: '2024-01-15',
                        'src-bug-fix': 1,
                        'src-bug-fix_tickets': ['TEST-123']
                    }
                ]
            };

            const html = generateSourceLabelsHtml('2024-01-15', payload, realData, mockJiraConfig);

            expect(html).toContain('https://test.atlassian.net/browse/TEST-123');
        });

        test('handles multiple source labels', () => {
            const payload = [
                { dataKey: 'src-bug-fix', name: 'Bug Fix', value: 2, color: '#ff0000' },
                { dataKey: 'src-new-feature', name: 'New Feature', value: 3, color: '#00ff00' }
            ];
            const realData = {
                sourceLabelsTimeSeries: [
                    {
                        date: '2024-01-15',
                        'src-bug-fix': 2,
                        'src-bug-fix_tickets': ['TEST-1', 'TEST-2'],
                        'src-new-feature': 3,
                        'src-new-feature_tickets': ['TEST-3', 'TEST-4', 'TEST-5']
                    }
                ]
            };

            const html = generateSourceLabelsHtml('2024-01-15', payload, realData, mockJiraConfig);

            expect(html).toContain('Bug Fix: 2 tickets');
            expect(html).toContain('New Feature: 3 tickets');
            expect(html).toContain('Total: 5 tickets');
        });

        test('filters out zero-value entries', () => {
            const payload = [
                { dataKey: 'src-bug-fix', name: 'Bug Fix', value: 2, color: '#ff0000' },
                { dataKey: 'src-new-feature', name: 'New Feature', value: 0, color: '#00ff00' }
            ];
            const realData = {
                sourceLabelsTimeSeries: [
                    {
                        date: '2024-01-15',
                        'src-bug-fix': 2,
                        'src-bug-fix_tickets': ['TEST-1', 'TEST-2']
                    }
                ]
            };

            const html = generateSourceLabelsHtml('2024-01-15', payload, realData, mockJiraConfig);

            expect(html).toContain('Bug Fix: 2 tickets');
            expect(html).not.toContain('New Feature');
        });
    });

    describe('generateFixedTicketsHtml', () => {
        test('generates valid HTML with correct title and date', () => {
            const payload = [
                { dataKey: 'src-bug-fix', name: 'Bug Fix', value: 2, color: '#ff0000' }
            ];
            const realData = {
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
                ],
                timeInterval: 'daily'
            };

            const html = generateFixedTicketsHtml('2024-01-15', payload, realData, mockJiraConfig);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<title>Fixed Tickets - 2024-01-15</title>');
            expect(html).toContain('Fixed Tickets');
            expect(html).toContain('Date: 2024-01-15');
            expect(html).toContain('Bug Fix: 2 tickets');
        });

        test('includes ticket summaries and links', () => {
            const payload = [
                { dataKey: 'src-bug-fix', name: 'Bug Fix', value: 1, color: '#ff0000' }
            ];
            const realData = {
                tickets: [
                    {
                        key: 'TEST-123',
                        summary: 'Fix critical bug in payment system',
                        isOutgoing: true,
                        outgoingDate: '2024-01-15T10:00:00Z',
                        sourceLabels: ['src-bug-fix']
                    }
                ],
                timeInterval: 'daily'
            };

            const html = generateFixedTicketsHtml('2024-01-15', payload, realData, mockJiraConfig);

            expect(html).toContain('TEST-123');
            expect(html).toContain('Fix critical bug in payment system');
            expect(html).toContain('https://test.atlassian.net/browse/TEST-123');
        });

        test('handles tickets with "other" source label', () => {
            const payload = [
                { dataKey: 'other', name: 'Other/No Label', value: 1, color: '#6b7280' }
            ];
            const realData = {
                tickets: [
                    {
                        key: 'TEST-1',
                        summary: 'Ticket without label',
                        isOutgoing: true,
                        outgoingDate: '2024-01-15T10:00:00Z',
                        sourceLabels: []
                    }
                ],
                timeInterval: 'daily'
            };

            const html = generateFixedTicketsHtml('2024-01-15', payload, realData, mockJiraConfig);

            expect(html).toContain('Other/No Label: 1 ticket');
            expect(html).toContain('TEST-1');
        });

        test('parses different date formats correctly', () => {
            const payload = [
                { dataKey: 'src-bug-fix', name: 'Bug Fix', value: 1, color: '#ff0000' }
            ];
            const currentYear = new Date().getFullYear();
            const realData = {
                tickets: [
                    {
                        key: 'TEST-1',
                        summary: 'Test ticket',
                        isOutgoing: true,
                        outgoingDate: '2024-01-15T10:00:00Z',
                        sourceLabels: ['src-bug-fix']
                    }
                ],
                timeInterval: 'daily'
            };

            // Test ISO date format
            let html = generateFixedTicketsHtml('2024-01-15', payload, realData, mockJiraConfig);
            expect(html).toContain('TEST-1');

            // Test M/d format - update ticket date to current year for this test
            const realDataCurrentYear = {
                tickets: [
                    {
                        key: 'TEST-1',
                        summary: 'Test ticket',
                        isOutgoing: true,
                        outgoingDate: `${currentYear}-01-15T10:00:00Z`,
                        sourceLabels: ['src-bug-fix']
                    }
                ],
                timeInterval: 'daily'
            };
            html = generateFixedTicketsHtml('1/15', payload, realDataCurrentYear, mockJiraConfig);
            expect(html).toContain('TEST-1');
        });
    });

    describe('openHtmlInNewTab', () => {
        let mockWindow;

        beforeEach(() => {
            mockWindow = {
                document: {
                    write: jest.fn(),
                    close: jest.fn()
                }
            };
            global.window.open = jest.fn(() => mockWindow);
        });

        test('opens new window with correct parameters', () => {
            const htmlContent = '<html><body>Test</body></html>';
            
            openHtmlInNewTab(htmlContent);

            expect(window.open).toHaveBeenCalledWith('', '_blank');
        });

        test('writes HTML content to new window', () => {
            const htmlContent = '<html><body>Test Content</body></html>';
            
            openHtmlInNewTab(htmlContent);

            expect(mockWindow.document.write).toHaveBeenCalledWith(htmlContent);
            expect(mockWindow.document.close).toHaveBeenCalled();
        });

        test('handles null window gracefully', () => {
            global.window.open = jest.fn(() => null);
            const htmlContent = '<html><body>Test</body></html>';
            
            // Should not throw error
            expect(() => openHtmlInNewTab(htmlContent)).not.toThrow();
        });
    });
});
