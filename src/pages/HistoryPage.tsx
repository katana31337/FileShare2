import { useAppStore } from '../store/useAppStore';
import { FileText, Download, Trash2, Clock, Link2 } from 'lucide-react';
import { useState } from 'react';

export default function HistoryPage() {
  const { uploadedFiles, sharedTexts, removeFile, removeText } = useAppStore();
  const [activeTab, setActiveTab] = useState<'files' | 'texts'>('files');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Истёк';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} дн. ${hours} ч.`;
    return `${hours} ч.`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'fa-image text-pink-500';
    if (type.startsWith('video/')) return 'fa-video text-purple-500';
    if (type.startsWith('audio/')) return 'fa-music text-orange-500';
    if (type.includes('pdf')) return 'fa-file-pdf text-red-500';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z'))
      return 'fa-file-zipper text-yellow-600';
    if (type.includes('word') || type.includes('document'))
      return 'fa-file-word text-blue-600';
    if (type.includes('sheet') || type.includes('excel'))
      return 'fa-file-excel text-green-600';
    return 'fa-file text-gray-500';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">История сессии</h1>
        <p className="text-gray-500">
          Все загруженные файлы и тексты в текущей сессии
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'files'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Файлы ({uploadedFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('texts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'texts'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Link2 className="w-4 h-4 inline mr-2" />
          Тексты ({sharedTexts.length})
        </button>
      </div>

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="space-y-3">
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Нет загруженных файлов</p>
              <p className="text-sm text-gray-400 mt-1">
                Загрузите файл на главной странице
              </p>
            </div>
          ) : (
            uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <i className={`fa ${getFileIcon(file.type)} text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(file.expiresAt)}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {file.downloads} скачиваний
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={file.downloadLink}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Скачать"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Texts Tab */}
      {activeTab === 'texts' && (
        <div className="space-y-3">
          {sharedTexts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Link2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Нет общих текстов</p>
              <p className="text-sm text-gray-400 mt-1">
                Создайте общий текст на соответствующей странице
              </p>
            </div>
          ) : (
            sharedTexts.map((text) => (
              <div
                key={text.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <i className="fa fa-file-lines text-blue-500 text-xl"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {text.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {text.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(text.expiresAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeText(text.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
