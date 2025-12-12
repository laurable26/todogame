import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Composant pour gérer les callbacks OAuth
const OAuthCallback = ({ provider }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState('processing');
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError(errorParam);
      return;
    }

    if (code) {
      // Sauvegarder le code dans sessionStorage pour que App.jsx puisse le récupérer
      sessionStorage.setItem(`oauth_${provider}_code`, code);
      setStatus('success');
      // Rediriger vers l'app après 1 seconde
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } else {
      setStatus('error');
      setError('Code d\'autorisation manquant');
    }
  }, [searchParams, provider, navigate]);

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
              Redirection vers l'application...
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
              onClick={() => navigate('/', { replace: true })}
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth/google/callback" element={<OAuthCallback provider="google" />} />
        <Route path="/auth/outlook/callback" element={<OAuthCallback provider="outlook" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
