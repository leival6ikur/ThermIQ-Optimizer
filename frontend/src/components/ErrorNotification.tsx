import React from 'react';

interface ErrorNotificationProps {
  errors: string[];
  warnings: string[];
  infos?: string[];
  onDismiss?: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  errors,
  warnings,
  infos = [],
  onDismiss,
}) => {
  if (errors.length === 0 && warnings.length === 0 && infos.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-2">
      {errors.map((error, index) => (
        <div
          key={`error-${index}`}
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 p-4 rounded shadow-sm"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-3 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

      {warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-700 p-4 rounded shadow-sm"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Warning</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{warning}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-3 text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

      {infos.map((info, index) => (
        <div
          key={`info-${index}`}
          className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-700 p-4 rounded shadow-sm"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Info</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{info}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-3 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
