// Runtime config — загружается из /config.json при старте приложения
// Файл генерируется при установке и монтируется в контейнер

export interface AppConfig {
  adminSecretPath: string; // например: "my-secret-panel-abc123"
}

let config: AppConfig | null = null;
let configPromise: Promise<AppConfig> | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (config) return config;
  if (configPromise) return configPromise;

  configPromise = fetch('/config.json')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load config');
      return res.json();
    })
    .then((data: AppConfig) => {
      config = data;
      return data;
    })
    .catch(() => {
      // Fallback — если config.json не найден, используем дефолт
      // В production это не должно происходить
      config = { adminSecretPath: 'admin' };
      return config as AppConfig;
    });

  return configPromise;
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config;
}
