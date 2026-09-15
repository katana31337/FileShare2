import { useState } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import TextSharePage from './pages/TextSharePage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'history':
        return <HistoryPage />;
      case 'text-share':
        return <TextSharePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1">
        {renderPage()}
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
