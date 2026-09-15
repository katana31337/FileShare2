import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { verifyPassword } from '../utils/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminCredentials, setIsAdmin } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!adminCredentials) {
        setError('Администратор не создан');
        return;
      }

      if (username !== adminCredentials.username) {
        setError('Неверный логин или пароль');
        return;
      }

      const isValid = await verifyPassword(password, adminCredentials.passwordHash);
      
      if (isValid) {
        setIsAdmin(true);
        // Сохраняем сессию в localStorage
        localStorage.setItem('admin_session', JSON.stringify({
          username,
          timestamp: Date.now()
        }));
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (err) {
      setError('Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full shadow-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Вход в панель администратора
          </h1>
          <p className="text-sm text-gray-500">
            Введите учётные данные для доступа
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              required
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
                placeholder="Введите пароль"
                required
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
