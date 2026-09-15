import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  Settings,
  Save,
  Database,
  Users,
  HardDrive,
  Clock,
  Shield,
  BarChart3,
  LogOut,
} from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, uploadedFiles, sharedTexts, setIsAdmin } = useAppStore();
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    // Очищаем сессию
    localStorage.removeItem('admin_session');
    setIsAdmin(false);
    // Перенаправляем на страницу входа
    navigate(0); // Перезагружаем страницу
  };

  const sections = [
    { id: 'general', label: 'Общие', icon: Settings },
    { id: 'files', label: 'Файлы', icon: HardDrive },
    { id: 'sessions', label: 'Сессии', icon: Clock },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'stats', label: 'Статистика', icon: BarChart3 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Панель администратора</h1>
          <p className="text-gray-500">Управление настройками сервиса</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saved ? (
              <>
                <Save className="w-4 h-4" />
                Сохранено!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 p-2 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Общие настройки
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Название сервиса
                  </label>
                  <input
                    type="text"
                    value={localSettings.serviceName}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, serviceName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Максимальный размер файла (MB)
                  </label>
                  <input
                    type="number"
                    value={localSettings.maxFileSize}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        maxFileSize: parseInt(e.target.value) || 0,
                      })
                    }
                    min={1}
                    max={10000}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Максимум файлов на сессию
                  </label>
                  <input
                    type="number"
                    value={localSettings.maxFilesPerSession}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        maxFilesPerSession: parseInt(e.target.value) || 0,
                      })
                    }
                    min={1}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Files Settings */}
          {activeSection === 'files' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                Настройки файлов
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Срок хранения файлов (дни)
                  </label>
                  <input
                    type="number"
                    value={localSettings.fileExpiryDays}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        fileExpiryDays: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                    max={365}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Через сколько дней файлы будут автоматически удалены
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Срок хранения текстов (дни)
                  </label>
                  <input
                    type="number"
                    value={localSettings.textExpiryDays}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        textExpiryDays: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                    max={365}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Разрешённые типы файлов
                  </label>
                  <input
                    type="text"
                    value={localSettings.allowedFileTypes.join(', ')}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        allowedFileTypes: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="* (все типы) или image/png, application/pdf..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Используйте * для всех типов, или укажите MIME-типы через запятую
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sessions Settings */}
          {activeSection === 'sessions' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Настройки сессий
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Время жизни сессии (дни)
                  </label>
                  <input
                    type="number"
                    value={localSettings.sessionExpiryDays}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        sessionExpiryDays: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                    max={365}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Если пользователь не заходил на сайт указанное количество дней, его сессия и история удаляются
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-800 mb-2">Как работают сессии:</h4>
                  <ul className="text-sm text-blue-700 space-y-1.5">
                    <li>• Сессия создаётся автоматически при первом посещении</li>
                    <li>• ID сессии хранится в cookie</li>
                    <li>• Каждый визит продлевает срок жизни сессии</li>
                    <li>• После истечения — сессия и все связанные данные удаляются</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Безопасность
              </h2>

              <div className="space-y-5">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Требования к паролю администратора
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Минимум 12 символов</li>
                    <li>• Заглавные и строчные буквы</li>
                    <li>• Цифры</li>
                    <li>• Специальные символы</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Секретный URL админки
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    URL для доступа к админке устанавливается при установке проекта через install.sh
                  </p>
                  <code className="text-sm bg-gray-200 px-3 py-1 rounded-lg text-gray-700">
                    /admin-secret-panel-xyz
                  </code>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="font-medium text-amber-800 mb-2">
                    <Database className="w-4 h-4 inline mr-1" />
                    Хранение настроек
                  </h4>
                  <p className="text-sm text-amber-700">
                    Все настройки хранятся в базе данных. Локальное хранение в браузере не используется для критичных данных.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {activeSection === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<HardDrive className="w-5 h-5" />}
                  label="Файлов загружено"
                  value={uploadedFiles.length.toString()}
                  color="blue"
                />
                <StatCard
                  icon={<Database className="w-5 h-5" />}
                  label="Текстов создано"
                  value={sharedTexts.length.toString()}
                  color="green"
                />
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  label="Активных сессий"
                  value="1"
                  color="purple"
                />
                <StatCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Uptime"
                  value="99.9%"
                  color="orange"
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Информация о системе
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Версия" value="1.0.0" />
                  <InfoRow label="Node.js" value="24.x LTS" />
                  <InfoRow label="База данных" value="PostgreSQL 16" />
                  <InfoRow label="Хранилище" value="Docker Volume" />
                  <InfoRow label="HTTPS" value="Настроен" />
                  <InfoRow label="Домен" value="fileshare.local" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}
