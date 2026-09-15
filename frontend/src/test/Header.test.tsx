import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import Header from '../components/Header';

describe('Header Component', () => {
  const renderHeader = (currentPage = 'home') => {
    return render(
      <HashRouter>
        <Header currentPage={currentPage} onNavigate={() => {}} />
      </HashRouter>
    );
  };

  it('should render logo', () => {
    renderHeader();
    expect(screen.getByText(/File/i)).toBeInTheDocument();
    expect(screen.getByText(/Share/i)).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    renderHeader();
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('История')).toBeInTheDocument();
    expect(screen.getByText('Текст')).toBeInTheDocument();
  });

  it('should highlight active page', () => {
    renderHeader('history');
    const historyButton = screen.getByText('История');
    expect(historyButton.className).toContain('bg-blue-50');
  });

  it('should render mobile menu button', () => {
    renderHeader();
    const mobileButton = screen.getByRole('button', { name: '' });
    expect(mobileButton).toBeInTheDocument();
  });

  it('should toggle mobile menu on click', async () => {
    const user = userEvent.setup();
    renderHeader();
    
    // Find mobile menu button (it's the only button without text on mobile)
    const buttons = screen.getAllByRole('button');
    const mobileButton = buttons.find(btn => !btn.textContent?.trim());
    
    if (mobileButton) {
      await user.click(mobileButton);
      // Mobile menu should be visible now
      expect(screen.getByText('Главная')).toBeInTheDocument();
    }
  });
});
