import { useState } from 'react';
import { useAppStore, generateId, SharedText } from '../store/useAppStore';
import { Send, Copy, CheckCircle, FileText } from 'lucide-react';

export default function TextSharePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recentText, setRecentText] = useState<SharedText | null>(null);
  const [copied, setCopied] = useState(false);
  const { addText, settings } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const textId = generateId();
    const sharedText: SharedText = {
      id: textId,
      title: title || 'Без названия',
      content: content.trim(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + settings.textExpiryDays * 24 * 60 * 60 * 1000),
      shareLink: `/text/${textId}`,
    };

    addText(sharedText);
    setRecentText(sharedText);
    setTitle('');
    setContent('');
  };

  const handleCopyLink = () => {
    if (recentText) {
      navigator.clipboard.writeText(
        `${window.location.origin}${recentText.shareLink}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Обмен текстом</h1>
        <p className="text-gray-500">
          Поделитесь текстом, кодом или заметкой по ссылке
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок (необязательно)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Код для ревью"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст / Код
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Вставьте текст, код или заметку..."
              rows={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Срок жизни: {settings.textExpiryDays} дней
            </span>
            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Создать ссылку
            </button>
          </div>
        </div>
      </form>

      {/* Result */}
      {recentText && (
        <div className="mt-6 bg-white border border-green-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold text-gray-800">Текст опубликован!</h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Заголовок:</span>
              <span className="text-sm font-medium text-gray-800">
                {recentText.title}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Истекает:</span>
              <span className="text-sm font-medium text-gray-800">
                {new Date(recentText.expiresAt).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <label className="text-xs text-gray-500 mb-1 block">
                Ссылка для доступа:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-blue-600 font-mono truncate">
                  {window.location.origin}{recentText.shareLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Копировать"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <label className="text-xs text-gray-500 mb-2 block">Предпросмотр:</label>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">
                {recentText.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Советы</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Используйте для обмена кодом, конфигами, заметками</li>
              <li>• Текст автоматически удаляется через {settings.textExpiryDays} дней</li>
              <li>• Ссылку можно отправить кому угодно — регистрация не нужна</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
