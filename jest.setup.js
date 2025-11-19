import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Fix TextEncoder/TextDecoder not defined issue
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock react-markdown and remark-gfm (ES modules)
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }) {
    return children;
  };
});

jest.mock('remark-gfm', () => {
  return () => {};
});

// Mock window.Recharts
global.window.Recharts = {
  LineChart: () => null,
  BarChart: () => null,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: () => null,
};

// Mock fetch for API calls
global.fetch = jest.fn();