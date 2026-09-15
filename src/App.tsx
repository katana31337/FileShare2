import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import TextSharePage from './pages/TextSharePage';
import AdminSetupPage from './pages/AdminSetupPage';
import AdminPage from './pages/AdminPage';

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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Админка без общего layout */}
        <Route path="/admin/setup" element={<AdminSetupPage />} />
        <Route path="/admin" element={<AdminPage />} />

        {/* Основной layout */}
        <Route path="/*" element={<Layout />} />
      </Routes>
    </HashRouter>
  );
}
