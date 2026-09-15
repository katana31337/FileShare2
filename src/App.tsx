import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import TextSharePage from './pages/TextSharePage';
import AdminSetupPage from './pages/AdminSetupPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { loadConfig, AppConfig } from './config';
import { useAppStore } from './store/useAppStore';

function AdminRoute({ secretPath }: { secretPath: string }) {
  const [loading, setLoading] = useState(true);
  const { adminCredentials, adminInitialized, setAdminCredentials, setAdminInitialized, setIsAdmin } = useAppStore();

  useEffect(() => {
    // Загружаем данные из localStorage при монтировании
    const savedCredentials = localStorage.getItem('admin_credentials');
    const savedSession = localStorage.getItem('admin_session');
    
    if (savedCredentials) {
      const creds = JSON.parse(savedCredentials);
      setAdminCredentials(creds);
      setAdminInitialized(true);
      
      // Проверяем сессию
      if (savedSession) {
        const session = JSON.parse(savedSession);
        // Сессия действительна 24 часа
        const isValid = Date.now() - session.timestamp < 24 * 60 * 60 * 1000;
        if (isValid && session.username === creds.username) {
          setIsAdmin(true);
        }
      }
    }
    
    setLoading(false);
  }, [setAdminCredentials, setAdminInitialized, setIsAdmin]);

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

  // Если админ не создан — показываем форму создания
  if (!adminCredentials) {
    return <AdminSetupPage />;
  }

  // Если админ создан, но не авторизован — показываем форму входа
  if (!adminInitialized || !useAppStore.getState().isAdmin) {
    return <LoginPage />;
  }

  // Авторизован — показываем админку
  return <AdminPage />;
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
      {/* Админка доступна ТОЛЬКО по секретному пути с авторизацией */}
      <Route path={`/${secretPath}/setup`} element={<AdminSetupPage />} />
      <Route path={`/${secretPath}`} element={<AdminRoute secretPath={secretPath} />} />

      {/* Основной layout с страницами */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
      <Route path="/text-share" element={<Layout><TextSharePage /></Layout>} />
      
      {/* 404 для всех остальных путей */}
      <Route path="*" element={<Layout><HomePage /></Layout>} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;
