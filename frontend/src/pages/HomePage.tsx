import { useState, useRef, useCallback } from 'react';
import { Upload, FileUp, X, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useAppStore, generateId, UploadedFile } from '../store/useAppStore';

export default function HomePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recentUpload, setRecentUpload] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFile, settings } = useAppStore();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const maxSizeBytes = settings.maxFileSize * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        setError(`Файл слишком большой. Максимум: ${settings.maxFileSize} MB`);
        return;
      }

      setError(null);
      setUploading(true);

      // Simulate upload
      setTimeout(() => {
        const fileId = generateId();
        const uploadedFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          uploadDate: new Date(),
          expiresAt: new Date(Date.now() + settings.fileExpiryDays * 24 * 60 * 60 * 1000),
          downloadLink: `/download/${fileId}`,
          downloads: 0,
        };

        addFile(uploadedFile);
        setRecentUpload(uploadedFile);
        setUploading(false);
      }, 1500);
    },
    [addFile, settings]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleCopyLink = () => {
    if (recentUpload) {
      navigator.clipboard.writeText(
        `${window.location.origin}${recentUpload.downloadLink}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
          Обмен файлами — просто и быстро
        </h1>
        <p className="text-gray-500 text-lg">
          Загрузите файл и получите ссылку для скачивания. Без регистрации.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Загрузка файла...</p>
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Перетащите файл сюда
              </p>
              <p className="text-sm text-gray-500 mt-1">
                или нажмите для выбора • Макс. {settings.maxFileSize} MB
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <FileUp className="w-4 h-4" />
              Выбрать файл
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Recent Upload Result */}
      {recentUpload && !uploading && (
        <div className="mt-6 bg-white border border-green-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold text-gray-800">Файл загружен!</h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Имя файла:</span>
              <span className="text-sm font-medium text-gray-800 truncate ml-4">
                {recentUpload.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Размер:</span>
              <span className="text-sm font-medium text-gray-800">
                {formatFileSize(recentUpload.size)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Истекает:</span>
              <span className="text-sm font-medium text-gray-800">
                {new Date(recentUpload.expiresAt).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <label className="text-xs text-gray-500 mb-1 block">
                Ссылка для скачивания:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-blue-600 font-mono truncate">
                  {window.location.origin}{recentUpload.downloadLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Копировать ссылку"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                <a
                  href={recentUpload.downloadLink}
                  className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Открыть"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <i className="fa fa-bolt text-blue-600"></i>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Быстро</h3>
          <p className="text-sm text-gray-500">
            Загрузка за секунды, мгновенный доступ по ссылке
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <i className="fa fa-user-secret text-green-600"></i>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Анонимно</h3>
          <p className="text-sm text-gray-500">
            Без регистрации, только сессионное отслеживание
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <i className="fa fa-clock text-purple-600"></i>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Срок жизни</h3>
          <p className="text-sm text-gray-500">
            Файлы хранятся {settings.fileExpiryDays} дней, затем удаляются
          </p>
        </div>
      </div>
    </div>
  );
}
