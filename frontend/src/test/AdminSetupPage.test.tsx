import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import AdminSetupPage from '../pages/AdminSetupPage';
import { useAppStore } from '../store/useAppStore';

// Mock config
vi.mock('../config', () => ({
  getConfig: () => ({ adminSecretPath: 'test-secret' }),
}));

describe('AdminSetupPage Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      adminCredentials: null,
      adminInitialized: false,
      isAdmin: false,
    });
    localStorage.clear();
  });

  const renderAdminSetupPage = () => {
    return render(
      <HashRouter>
        <AdminSetupPage />
      </HashRouter>
    );
  };

  it('should render setup form', () => {
    renderAdminSetupPage();
    expect(screen.getByText(/Создание администратора/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Минимум 3 символа/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Минимум 12 символов/i)).toBeInTheDocument();
  });

  it('should show password requirements', () => {
    renderAdminSetupPage();
    expect(screen.getByText(/Минимум 12 символов/i)).toBeInTheDocument();
    expect(screen.getByText(/Заглавная буква/i)).toBeInTheDocument();
    expect(screen.getByText(/Строчная буква/i)).toBeInTheDocument();
    expect(screen.getByText(/Цифра/i)).toBeInTheDocument();
    expect(screen.getByText(/Спецсимвол/i)).toBeInTheDocument();
  });

  it('should disable submit when requirements not met', async () => {
    const user = userEvent.setup();
    renderAdminSetupPage();
    
    await user.type(screen.getByPlaceholderText(/Минимум 3 символа/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Минимум 12 символов/i), 'weak');
    
    const submitButton = screen.getByRole('button', { name: /Создать/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit when all requirements met', async () => {
    const user = userEvent.setup();
    renderAdminSetupPage();
    
    await user.type(screen.getByPlaceholderText(/Минимум 3 символа/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Минимум 12 символов/i), 'StrongPass123!');
    await user.type(screen.getByPlaceholderText(/Повторите пароль/i), 'StrongPass123!');
    
    const submitButton = screen.getByRole('button', { name: /Создать/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderAdminSetupPage();
    
    await user.type(screen.getByPlaceholderText(/Минимум 3 символа/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Минимум 12 символов/i), 'StrongPass123!');
    await user.type(screen.getByPlaceholderText(/Повторите пароль/i), 'DifferentPass123!');
    
    expect(screen.getByText(/Пароли не совпадают/i)).toBeInTheDocument();
  });

  it('should create admin successfully', async () => {
    const user = userEvent.setup();
    renderAdminSetupPage();
    
    await user.type(screen.getByPlaceholderText(/Минимум 3 символа/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Минимум 12 символов/i), 'StrongPass123!');
    await user.type(screen.getByPlaceholderText(/Повторите пароль/i), 'StrongPass123!');
    
    await user.click(screen.getByRole('button', { name: /Создать/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Администратор создан/i)).toBeInTheDocument();
    });
    
    // Check that credentials were saved
    expect(useAppStore.getState().adminCredentials).not.toBeNull();
    expect(useAppStore.getState().adminCredentials?.username).toBe('admin');
    expect(useAppStore.getState().isAdmin).toBe(true);
    
    // Check localStorage
    expect(localStorage.getItem('admin_credentials')).not.toBeNull();
    expect(localStorage.getItem('admin_session')).not.toBeNull();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderAdminSetupPage();
    
    const passwordInput = screen.getByPlaceholderText(/Минимум 12 символов/i);
    const toggleButtons = screen.getAllByRole('button', { name: '' });
    const toggleButton = toggleButtons[0]; // First eye icon
    
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('should show security note', () => {
    renderAdminSetupPage();
    expect(screen.getByText(/Сохраните данные в безопасном месте/i)).toBeInTheDocument();
  });
});
