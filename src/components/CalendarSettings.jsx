import React from 'react';

const CalendarSettings = ({ calendarSync, theme }) => {
  const { google, outlook, isSyncing, syncAll } = calendarSync;

  const formatLastSync = (dateString) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Calendriers connectés
        </h3>
        {(google.isConnected || outlook.isConnected) && (
          <button
            onClick={syncAll}
            disabled={isSyncing}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              isSyncing 
                ? 'bg-slate-200 text-slate-500' 
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            {isSyncing ? 'Sync...' : 'Synchroniser'}
          </button>
        )}
      </div>

      {/* Google Calendar */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">Google Calendar</h4>
            {google.isConnected && (
              <p className="text-xs text-slate-500">
                Dernière sync: {formatLastSync(google.lastSync)}
              </p>
            )}
          </div>
          {google.isLoading ? (
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          ) : google.isConnected ? (
            <button
              onClick={google.disconnect}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Déconnecter
            </button>
          ) : (
            <button
              onClick={google.connect}
              className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Connecter
            </button>
          )}
        </div>
        
        {google.isConnected && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <span>✅</span>
            <span>{google.events.length} événement(s) synchronisé(s)</span>
          </div>
        )}
        
        {google.error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
            ⚠️ {google.error}
          </div>
        )}
      </div>

      {/* Outlook Calendar - Temporairement désactivé */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.154-.353.23-.577.23h-8.186V6.58h8.186c.224 0 .418.077.577.23.158.153.238.347.238.577z"/>
              <path fill="#0364B8" d="M15 6.58v12.09L8.367 21l-6.129-1.363C1.583 19.483 1.163 19 1.163 18.343V5.656c0-.656.42-1.14 1.075-1.294L8.367 3 15 6.58z"/>
              <path fill="#0078D4" d="M15 6.58H8.367v12.09L15 21V6.58z"/>
              <path fill="#28A8EA" d="M11.08 9.478c.366-.27.8-.405 1.305-.405.6 0 1.097.191 1.492.572.395.382.593.873.593 1.473 0 .6-.21 1.098-.628 1.493-.42.395-.95.593-1.59.593-.554 0-1.02-.135-1.398-.405-.378-.27-.634-.65-.767-1.14h1.21c.172.395.495.593.97.593.31 0 .565-.103.767-.308.202-.206.303-.48.303-.823 0-.343-.1-.62-.303-.833-.202-.212-.463-.318-.783-.318-.366 0-.656.153-.87.46l-1.046-.23.393-3.12h3.458v1.012H10.42l-.152 1.266c.27-.126.536-.19.8-.19z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">Outlook / Microsoft 365</h4>
            <p className="text-xs text-slate-500">Bientôt disponible</p>
          </div>
          <span className="px-3 py-1.5 text-sm bg-slate-200 text-slate-500 rounded-lg">
            Bientôt
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
        <p className="flex items-start gap-2">
          <span>💡</span>
          <span>
            Les événements de vos calendriers seront automatiquement importés comme événements dans ToDoGame. 
            La synchronisation se fait toutes les 5 minutes.
          </span>
        </p>
      </div>
    </div>
  );
};

export default CalendarSettings;
