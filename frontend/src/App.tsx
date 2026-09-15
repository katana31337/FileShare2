import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import TextSharePage from './pages/TextSharePage';
import AdminSetupPage from './pages/AdminSetupPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Admin setup (first-time) */}
        <Route path="/admin/setup" element={<AdminSetupPage />} />

        {/* Main app layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/text-share" element={<TextSharePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
