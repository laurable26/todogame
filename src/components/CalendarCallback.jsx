import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const CalendarCallback = ({ onGoogleCallback, onOutlookCallback }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      
      if (errorParam) {
        setStatus('error');
        setError(errorParam);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('Code d\'autorisation manquant');
        return;
      }

      try {
        // Déterminer si c'est Google ou Outlook
        const isGoogle = location.pathname.includes('/google/');
        const isOutlook = location.pathname.includes('/outlook/');

        let result;
        if (isGoogle && onGoogleCallback) {
          result = await onGoogleCallback(code);
        } else if (isOutlook && onOutlookCallback) {
          result = await onOutlookCallback(code);
        }

        if (result?.success) {
          setStatus('success');
          // Rediriger vers la page principale après 2 secondes
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          setStatus('error');
          setError(result?.error || 'Erreur de connexion');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    };

    handleCallback();
  }, [searchParams, location, onGoogleCallback, onOutlookCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Connexion en cours...
            </h2>
            <p className="text-slate-600">
              Veuillez patienter pendant que nous connectons votre calendrier.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Calendrier connecté !
            </h2>
            <p className="text-slate-600">
              Vos événements seront maintenant synchronisés automatiquement.
            </p>
            <p className="text-slate-500 text-sm mt-4">
              Redirection en cours...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Erreur de connexion
            </h2>
            <p className="text-red-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Retour à l'application
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarCallback;
