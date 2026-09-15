import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import TextSharePage from './pages/TextSharePage';
import AdminSetupPage from './pages/AdminSetupPage';
import AdminPage from './pages/AdminPage';
import { loadConfig, AppConfig } from './config';

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
