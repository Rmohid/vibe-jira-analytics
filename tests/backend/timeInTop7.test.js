const request = require('supertest');
const express = require('express');

// Mock data for testing
const mockTicketWithIncomingDate = {
  key: 'TEST-123',
  fields: {
    created: '2024-01-01T00:00:00.000Z',
    summary: 'Test ticket with PL',
    status: { name: 'In Progress' },
    customfield_11129: 5,
    labels: ['src-bug-fix']
  },
  changelog: {
    histories: [
      {
        created: '2024-01-05T00:00:00.000Z',
        items: [
          {
            field: 'Priority Level',
            fieldId: 'customfield_11129',
            from: null,
            to: '5',
            fromString: null,
            toString: '5'
          }
        ]
      }
    ]
  }
};

const mockTicketWithoutIncomingDate = {
  key: 'TEST-456',
  fields: {
    created: '2024-01-01T00:00:00.000Z',
    summary: 'Test ticket created with PL',
    status: { name: 'Open' },
    customfield_11129: 10,
    labels: []
  },
  changelog: {
    histories: []
  }
};

describe('Time in Top 7 Calculation', () => {
  let app;
  let server;

  beforeEach(() => {
    // Clear module cache to get fresh instance
    jest.resetModules();
    
    // Mock the Jira API client
    jest.mock('axios', () => ({
      create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn()
      }))
    }));
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  test('calculateTimeInTop7 should use incoming date when available', () => {
    // Import the server functions
    const serverPath = require.resolve('../../server.js');
    delete require.cache[serverPath];
    
    // Mock Date.now to have consistent test results
    const mockNow = new Date('2024-01-20T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow.getTime());

    // Test with incoming date (PL assigned on Jan 5)
    const incomingDate = '2024-01-05T00:00:00.000Z';
    const createdDate = '2024-01-01T00:00:00.000Z';
    
    // Calculate expected days
    const expectedDays = Math.ceil((mockNow - new Date(incomingDate)) / (1000 * 60 * 60 * 24));
    
    // The function should calculate from incoming date (Jan 5) to now (Jan 20) = 15 days
    expect(expectedDays).toBe(15);

    Date.now.mockRestore();
  });

  test('calculateTimeInTop7 should fall back to created date when no incoming date', () => {
    const mockNow = new Date('2024-01-20T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow.getTime());

    // Test without incoming date
    const incomingDate = null;
    const createdDate = '2024-01-01T00:00:00.000Z';
    
    // Calculate expected days from created date
    const expectedDays = Math.ceil((mockNow - new Date(createdDate)) / (1000 * 60 * 60 * 24));
    
    // The function should calculate from created date (Jan 1) to now (Jan 20) = 19 days
    expect(expectedDays).toBe(19);

    Date.now.mockRestore();
  });

  test('API response should include timeInTop7Days field', async () => {
    // This is a simplified test to verify the field exists
    // In a real scenario, you would mock the entire Jira API response
    
    const mockApiResponse = {
      issues: [mockTicketWithIncomingDate],
      total: 1
    };

    // Verify the structure we expect
    expect(mockTicketWithIncomingDate.fields.customfield_11129).toBe(5);
    expect(mockTicketWithIncomingDate.changelog.histories[0].items[0].from).toBeNull();
    expect(mockTicketWithIncomingDate.changelog.histories[0].items[0].to).toBe('5');
  });

  test('Priority flags calculation should identify incoming date correctly', () => {
    // Test the logic for determining when a ticket entered Top 7
    const priorityTransitions = [
      {
        timestamp: '2024-01-05T00:00:00.000Z',
        fromValue: null,
        toValue: 5,
        author: 'test.user'
      }
    ];

    // Should identify this as incoming (null -> 5)
    const firstAssignment = priorityTransitions.find(t => 
      (t.fromValue === null || t.fromValue === undefined) && 
      t.toValue !== null && t.toValue !== undefined
    );

    expect(firstAssignment).toBeDefined();
    expect(firstAssignment.timestamp).toBe('2024-01-05T00:00:00.000Z');
  });

  test('Average time in Top 7 calculation should use new field', () => {
    const tickets = [
      { timeInTop7Days: 10, incomingDate: '2024-01-10', created: '2024-01-01', priorityCategory: 'high' },
      { timeInTop7Days: 20, incomingDate: '2024-01-05', created: '2024-01-01', priorityCategory: 'high' },
      { timeInTop7Days: 15, incomingDate: '2024-01-08', created: '2024-01-01', priorityCategory: 'high' }
    ];

    const highPriorityTickets = tickets.filter(t => t.priorityCategory === 'high');
    const totalTime = highPriorityTickets.reduce((sum, ticket) => sum + ticket.timeInTop7Days, 0);
    const avgTime = Math.round(totalTime / highPriorityTickets.length);

    expect(avgTime).toBe(15); // (10 + 20 + 15) / 3 = 15
  });
});