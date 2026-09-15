import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';

// Mock crypto.subtle for tests
const mockSubtle = {
  digest: async () => new ArrayBuffer(32),
};

beforeEach(() => {
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: mockSubtle,
    },
  });
});

describe('HomePage Component', () => {
  const renderHomePage = () => {
    return render(
      <HashRouter>
        <HomePage />
      </HashRouter>
    );
  };

  it('should render hero section', () => {
    renderHomePage();
    expect(screen.getByText(/Обмен файлами/i)).toBeInTheDocument();
  });

  it('should render upload area', () => {
    renderHomePage();
    expect(screen.getByText(/Перетащите файл/i)).toBeInTheDocument();
    expect(screen.getByText(/Выбрать файл/i)).toBeInTheDocument();
  });

  it('should render info cards', () => {
    renderHomePage();
    expect(screen.getByText('Быстро')).toBeInTheDocument();
    expect(screen.getByText('Анонимно')).toBeInTheDocument();
    expect(screen.getByText('Срок жизни')).toBeInTheDocument();
  });

  it('should have file input', () => {
    renderHomePage();
    const fileInput = screen.getByLabelText(/выбрать/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
  });
});
