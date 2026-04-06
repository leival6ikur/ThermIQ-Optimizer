import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComparisonPage } from '../ComparisonPage';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock fetch
global.fetch = vi.fn();

const mockWeekData = {
  week1: {
    start: '2026-03-30T00:00:00',
    end: '2026-04-06T00:00:00',
    label: 'Mar 30 - Apr 06, 2026',
    energy_kwh: 154.68,
    cost: 8.34,
    comfort_score: 0.0,
    avg_indoor_temp: 10.0,
    duty_cycle: 91.4,
    heating_hours: 112.6,
  },
  week2: {
    start: '2026-03-23T00:00:00',
    end: '2026-03-30T00:00:00',
    label: 'Mar 23 - Mar 30, 2026',
    energy_kwh: 69.12,
    cost: 5.53,
    comfort_score: 0.1,
    avg_indoor_temp: 10.2,
    duty_cycle: 99.9,
    heating_hours: 55.4,
  },
  changes: {
    energy_change_percent: -13.6,
    cost_change_percent: -16.6,
    comfort_change_points: -0.1,
    temp_change_celsius: -0.2,
    energy_improved: true,
    cost_improved: true,
    comfort_improved: false,
  },
};

const mockMonthData = {
  month1: {
    start: '2026-04-01T00:00:00',
    end: '2026-05-01T00:00:00',
    label: 'April 2026',
    energy_kwh: 94.51,
    cost: 4.9,
    comfort_score: 0.0,
    avg_indoor_temp: 10.0,
    duty_cycle: 85.9,
    heating_hours: 64.6,
  },
  month2: {
    start: '2026-03-01T00:00:00',
    end: '2026-04-01T00:00:00',
    label: 'March 2026',
    energy_kwh: 129.26,
    cost: 10.98,
    comfort_score: 0.1,
    avg_indoor_temp: 10.1,
    duty_cycle: 100.0,
    heating_hours: 103.4,
  },
  changes: {
    energy_change_percent: -27.4,
    cost_change_percent: -55.4,
    comfort_change_points: -0.1,
    temp_change_celsius: -0.1,
    energy_improved: true,
    cost_improved: true,
    comfort_improved: false,
  },
};

const mockDailyData = {
  start_date: '2026-03-27T00:00:00',
  end_date: '2026-04-03T23:59:59',
  days_count: 7,
  daily_data: [
    {
      date: '2026-03-27',
      day_name: 'Thursday',
      energy_kwh: 20.5,
      cost: 5.4,
      comfort_score: 97.0,
    },
    {
      date: '2026-03-28',
      day_name: 'Friday',
      energy_kwh: 21.2,
      cost: 5.6,
      comfort_score: 96.5,
    },
  ],
};

describe('ComparisonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup fetch mock
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/compare/week')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWeekData),
        });
      }
      if (url.includes('/api/compare/month')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonthData),
        });
      }
      if (url.includes('/api/compare/daily')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDailyData),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders comparison page', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    expect(screen.getByText('Performance Comparison')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    expect(screen.getByText(/Loading comparison data/i)).toBeInTheDocument();
  });

  it('loads and displays week comparison by default', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading comparison data/i)).not.toBeInTheDocument();
    });

    // Check that week data is displayed
    expect(screen.getByText('Mar 30 - Apr 06, 2026')).toBeInTheDocument();
    expect(screen.getByText('154.68 kWh')).toBeInTheDocument();
    expect(screen.getByText('€8.34')).toBeInTheDocument();
  });

  it('week comparison button is active by default', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const weekButton = screen.getByText('Week Comparison');
    expect(weekButton).toHaveClass('bg-primary');
  });

  it('switches to month view when month button clicked', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Should show week data initially
    expect(screen.getByText('Mar 30 - Apr 06, 2026')).toBeInTheDocument();

    // Click month button
    const monthButton = screen.getByText('Month Comparison');
    fireEvent.click(monthButton);

    // Should show month data
    await waitFor(() => {
      expect(screen.getByText('April 2026')).toBeInTheDocument();
      expect(screen.getByText('March 2026')).toBeInTheDocument();
    });

    // Check month-specific values
    expect(screen.getByText('94.51 kWh')).toBeInTheDocument();
    expect(screen.getByText('€4.90')).toBeInTheDocument();
  });

  it('month button becomes active after click', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const monthButton = screen.getByText('Month Comparison');
    fireEvent.click(monthButton);

    await waitFor(() => {
      expect(monthButton).toHaveClass('bg-primary');
    });
  });

  it('week button becomes inactive when month is selected', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const weekButton = screen.getByText('Week Comparison');
    const monthButton = screen.getByText('Month Comparison');

    fireEvent.click(monthButton);

    await waitFor(() => {
      expect(weekButton).not.toHaveClass('bg-primary');
    });
  });

  it('can toggle back to week view from month view', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Go to month view
    fireEvent.click(screen.getByText('Month Comparison'));

    await waitFor(() => {
      expect(screen.getByText('April 2026')).toBeInTheDocument();
    });

    // Go back to week view
    fireEvent.click(screen.getByText('Week Comparison'));

    await waitFor(() => {
      expect(screen.getByText('Mar 30 - Apr 06, 2026')).toBeInTheDocument();
    });
  });

  it('displays change indicators', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Performance Change/i)).toBeInTheDocument();
    expect(screen.getByText('Energy Usage')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('shows improvement indicators correctly', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Energy improved (reduced)
    expect(screen.getByText(/Reduced/i)).toBeInTheDocument();
  });

  it('displays daily breakdown chart', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Daily Energy & Cost Breakdown/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as any).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Should show "No comparison data available" or similar
    expect(screen.getByText(/No comparison data available/i)).toBeInTheDocument();
  });

  it('makes correct API calls on load', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Check all required API calls were made
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/compare/week');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/compare/month');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/compare/daily?days=14');
  });

  it('displays both period cards', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Current Week')).toBeInTheDocument();
    expect(screen.getByText('Previous Week')).toBeInTheDocument();
  });

  it('updates period labels when switching views', async () => {
    render(
      <ThemeProvider>
        <ComparisonPage />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Initially shows week labels
    expect(screen.getByText('Current Week')).toBeInTheDocument();

    // Click month
    fireEvent.click(screen.getByText('Month Comparison'));

    // Should show month labels
    await waitFor(() => {
      expect(screen.getByText('Current Month')).toBeInTheDocument();
      expect(screen.getByText('Previous Month')).toBeInTheDocument();
    });
  });
});
