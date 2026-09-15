import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { useAppStore } from '../store/useAppStore';
import { hashPassword } from '../utils/auth';

describe('LoginPage Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      adminCredentials: null,
      isAdmin: false,
    });
  });

  const renderLoginPage = () => {
    return render(
      <HashRouter>
        <LoginPage />
      </HashRouter>
    );
  };

  it('should render login form', () => {
    renderLoginPage();
    expect(screen.getByText(/Вход в панель/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Введите логин/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Введите пароль/i)).toBeInTheDocument();
  });

  it('should have submit button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /Войти/i })).toBeInTheDocument();
  });

  it('should disable submit when fields are empty', () => {
    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /Войти/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit when fields are filled', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    
    await user.type(screen.getByPlaceholderText(/Введите логин/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Введите пароль/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /Войти/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should show error when admin not created', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    
    await user.type(screen.getByPlaceholderText(/Введите логин/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Введите пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Войти/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Администратор не создан/i)).toBeInTheDocument();
    });
  });

  it('should show error for wrong credentials', async () => {
    const user = userEvent.setup();
    
    // Setup admin credentials
    const passwordHash = await hashPassword('correctpassword');
    useAppStore.setState({
      adminCredentials: {
        username: 'admin',
        passwordHash,
      },
    });
    
    renderLoginPage();
    
    await user.type(screen.getByPlaceholderText(/Введите логин/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Введите пароль/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Войти/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Неверный логин или пароль/i)).toBeInTheDocument();
    });
  });

  it('should login with correct credentials', async () => {
    const user = userEvent.setup();
    
    // Setup admin credentials
    const password = 'correctpassword';
    const passwordHash = await hashPassword(password);
    useAppStore.setState({
      adminCredentials: {
        username: 'admin',
        passwordHash,
      },
    });
    
    renderLoginPage();
    
    await user.type(screen.getByPlaceholderText(/Введите логин/i), 'admin');
    await user.type(screen.getByPlaceholderText(/Введите пароль/i), password);
    await user.click(screen.getByRole('button', { name: /Войти/i }));
    
    await waitFor(() => {
      expect(useAppStore.getState().isAdmin).toBe(true);
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    
    const passwordInput = screen.getByPlaceholderText(/Введите пароль/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
    
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
