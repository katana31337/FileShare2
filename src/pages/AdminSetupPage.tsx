import { useState } from 'react';
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
}

export default function AdminSetupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { setAdminInitialized } = useAppStore();

  const validatePassword = (pwd: string): PasswordValidation => ({
    length: pwd.length >= 12,
    uppercase: /[A-ZА-Я]/.test(pwd),
    lowercase: /[a-zа-я]/.test(pwd),
    numbers: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  });

  const validation = validatePassword(password);
  const isAllValid = Object.values(validation).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = username.length >= 3 && isAllValid && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    setAdminInitialized(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Администратор создан!
          </h2>
          <p className="text-gray-500 mb-6">
            Панель администратора доступна. Вы будете перенаправлены.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Перейти в админку
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full shadow-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Создание администратора
          </h1>
          <p className="text-sm text-gray-500">
            Первый вход в панель управления. Создайте учётные данные.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Минимум 3 символа"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 12 символов"
                className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password requirements */}
            <div className="mt-2 space-y-1">
              <Requirement valid={validation.length} text="Минимум 12 символов" />
              <Requirement valid={validation.uppercase} text="Заглавная буква (A-Z, А-Я)" />
              <Requirement valid={validation.lowercase} text="Строчная буква (a-z, а-я)" />
              <Requirement valid={validation.numbers} text="Цифра (0-9)" />
              <Requirement valid={validation.special} text="Спецсимвол (!@#$...)" />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Подтвердите пароль
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                confirmPassword && !passwordsMatch
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200'
              }`}
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            Создать администратора
          </button>
        </form>

        {/* Security note */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Сохраните данные в безопасном месте. После создания изменить пароль можно будет только через базу данных.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Requirement({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
          valid ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        {valid && (
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <span className={`text-xs ${valid ? 'text-green-600' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  );
}
