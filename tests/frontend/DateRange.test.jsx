import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

// Mock the hooks and API calls
jest.mock('../../src/hooks/useJiraData', () => ({
  useJiraData: () => ({
    loading: false,
    connectionStatus: 'disconnected',
    lastSync: null,
    realData: null,
    error: null,
    fetchData: jest.fn(),
    setRealData: jest.fn(),
    setError: jest.fn(),
    setLoading: jest.fn()
  })
}));

describe('Custom Date Range Functionality', () => {
  test('should show Date Range option in period selector', () => {
    render(<App />);
    
    // Find the period selector
    const periodSelector = screen.getByDisplayValue('Last 30 days');
    expect(periodSelector).toBeInTheDocument();
    
    // Check that Date Range option exists
    const dateRangeOption = screen.getByText('Date Range');
    expect(dateRangeOption).toBeInTheDocument();
  });

  test('should show date inputs when Date Range is selected', () => {
    render(<App />);
    
    // Select Date Range option
    const periodSelector = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(periodSelector, { target: { value: 'dateRange' } });
    
    // Check that date inputs appear
    const dateInputs = screen.getAllByDisplayValue('');
    const startDateInput = dateInputs.find(input => input.type === 'date');
    expect(startDateInput).toBeInTheDocument();
    
    // Check for "to" text
    expect(screen.getByText('to')).toBeInTheDocument();
  });

  test('should show validation message for invalid date range', () => {
    render(<App />);
    
    // Select Date Range option
    const periodSelector = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(periodSelector, { target: { value: 'dateRange' } });
    
    // Get date inputs
    const dateInputs = screen.getAllByDisplayValue('');
    const startDateInput = dateInputs[0];
    const endDateInput = dateInputs[1];
    
    // Set invalid date range (start after end)
    fireEvent.change(startDateInput, { target: { value: '2024-01-15' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-10' } });
    
    // Check for validation message
    expect(screen.getByText('Start date must be before end date')).toBeInTheDocument();
  });

  test('should not show date inputs when other period options are selected', () => {
    render(<App />);
    
    // Select Date Range first
    const periodSelector = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(periodSelector, { target: { value: 'dateRange' } });
    
    // Verify date inputs appear
    expect(screen.getByText('to')).toBeInTheDocument();
    
    // Change back to 7d
    fireEvent.change(periodSelector, { target: { value: '7d' } });
    
    // Verify date inputs disappear
    expect(screen.queryByText('to')).not.toBeInTheDocument();
  });

  test('should not show validation message for valid date range', () => {
    render(<App />);
    
    // Select Date Range option
    const periodSelector = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(periodSelector, { target: { value: 'dateRange' } });
    
    // Get date inputs
    const dateInputs = screen.getAllByDisplayValue('');
    const startDateInput = dateInputs[0];
    const endDateInput = dateInputs[1];
    
    // Set valid date range
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-15' } });
    
    // Check that validation message does not appear
    expect(screen.queryByText('Start date must be before end date')).not.toBeInTheDocument();
  });
});