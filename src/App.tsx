import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import TextSharePage from './pages/TextSharePage';
import AdminSetupPage from './pages/AdminSetupPage';
import AdminPage from './pages/AdminPage';
import { loadConfig, AppConfig } from './config';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем текущую страницу из URL
  const getPageFromPath = (path: string): string => {
    if (path === '/' || path === '') return 'home';
    if (path === '/history') return 'history';
    if (path === '/text-share') return 'text-share';
    return 'home';
  };

  const currentPage = getPageFromPath(location.pathname);

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'text-share':
        navigate('/text-share');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/text-share" element={<TextSharePage />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm text-gray-500">
              © 2026 FileShare — Анонимный обмен файлами и текстом
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">
                <i className="fa fa-shield-halved mr-1"></i>
                Без регистрации
              </span>
              <span className="text-xs text-gray-400">
                <i className="fa fa-lock mr-1"></i>
                HTTPS
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppRoutes() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return <div>Ошибка загрузки конфигурации</div>;
  }

  const secretPath = config.adminSecretPath;

  return (
    <Routes>
      {/* Админка доступна ТОЛЬКО по секретному пути */}
      <Route path={`/${secretPath}/setup`} element={<AdminSetupPage />} />
      <Route path={`/${secretPath}`} element={<AdminPage />} />

      {/* Все остальные пути — основной layout */}
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
