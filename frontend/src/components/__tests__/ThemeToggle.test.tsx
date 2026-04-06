import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    const initialClass = document.documentElement.className;

    fireEvent.click(button);

    const newClass = document.documentElement.className;
    expect(newClass).not.toBe(initialClass);
  });

  it('persists theme to localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const storedTheme = localStorage.getItem('theme');
    expect(storedTheme).toBeTruthy();
    expect(['light', 'dark']).toContain(storedTheme);
  });

  it('applies dark mode class to document', () => {
    // Set dark mode
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies light mode class to document', () => {
    // Set light mode
    localStorage.setItem('theme', 'light');

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
