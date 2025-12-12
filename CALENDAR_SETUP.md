# 📅 Guide d'intégration Google Calendar & Outlook - ToDoGame

## 📋 Fichiers créés

```
todogame/
├── src/
│   ├── hooks/
│   │   ├── useGoogleCalendar.js    ← Hook Google Calendar
│   │   ├── useOutlookCalendar.js   ← Hook Outlook Calendar
│   │   └── useCalendarSync.js      ← Hook combiné
│   └── components/
│       ├── CalendarCallback.jsx    ← Page de callback OAuth
│       └── CalendarSettings.jsx    ← UI dans les paramètres
├── supabase/
│   ├── migrations/
│   │   └── calendar_tables.sql     ← Tables SQL
│   └── functions/
│       ├── google-calendar-auth/
│       │   └── index.ts            ← Edge Function auth
│       └── google-calendar-refresh/
│           └── index.ts            ← Edge Function refresh
└── CALENDAR_SETUP.md               ← Ce fichier
```

---

## 🚀 Étapes d'installation

### Étape 1 : Variables d'environnement

Ajoute ces lignes à ton fichier `.env` :

```env
# Google Calendar
VITE_GOOGLE_CLIENT_ID=722749884420-tdt45be0eoi71ht97pn5rtljqjhm0l38.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://todogame-app.vercel.app/auth/google/callback

# Outlook Calendar (à configurer plus tard)
VITE_OUTLOOK_CLIENT_ID=
VITE_OUTLOOK_REDIRECT_URI=https://todogame-app.vercel.app/auth/outlook/callback
```

---

### Étape 2 : Tables Supabase

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Ouvre ton projet ToDoGame
3. Va dans **SQL Editor**
4. Copie-colle le contenu de `supabase/migrations/calendar_tables.sql`
5. Clique **Run**

---

### Étape 3 : Edge Functions Supabase

Tu dois déployer les Edge Functions pour gérer les tokens OAuth de manière sécurisée.

#### 3.1 Installer Supabase CLI

```bash
npm install -g supabase
```

#### 3.2 Se connecter

```bash
supabase login
```

#### 3.3 Lier ton projet

```bash
cd todogame
supabase link --project-ref TON_PROJECT_REF
```

(Tu trouves ton project-ref dans l'URL de ton dashboard Supabase)

#### 3.4 Configurer les secrets

```bash
supabase secrets set GOOGLE_CLIENT_ID=722749884420-tdt45be0eoi71ht97pn5rtljqjhm0l38.apps.googleusercontent.com
supabase secrets set GOOGLE_CLIENT_SECRET=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
```

#### 3.5 Déployer les fonctions

```bash
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-refresh
```

---

### Étape 4 : Modifier main.jsx pour le routing

Tu dois ajouter le routing pour gérer les callbacks OAuth.

Modifie `src/main.jsx` :

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import CalendarCallback from './components/CalendarCallback.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth/google/callback" element={<CalendarCallbackWrapper />} />
        <Route path="/auth/outlook/callback" element={<CalendarCallbackWrapper />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

// Wrapper pour passer les callbacks
function CalendarCallbackWrapper() {
  // Les callbacks seront passés depuis App via un contexte ou state global
  return <CalendarCallback />
}
```

**Note:** Tu devras aussi installer react-router-dom :
```bash
npm install react-router-dom
```

---

### Étape 5 : Intégrer dans App.jsx

Ajoute le hook useCalendarSync dans ton App.jsx :

```jsx
// En haut du fichier, ajouter l'import :
import { useCalendarSync } from './hooks/useCalendarSync';

// Dans le composant QuestApp, après les autres hooks :
const calendarSync = useCalendarSync(supabaseUser?.id);

// Les événements de calendrier sont dans :
// - calendarSync.todayEvents (événements d'aujourd'hui)
// - calendarSync.calendarEvents (tous les événements)
```

---

### Étape 6 : Ajouter CalendarSettings dans SettingsModal

Dans ton fichier de modals, ajoute CalendarSettings :

```jsx
import CalendarSettings from './CalendarSettings';

// Dans SettingsModal, ajouter une section :
<CalendarSettings calendarSync={calendarSync} theme={theme} />
```

---

### Étape 7 : Afficher les événements calendrier

Dans TasksPage ou là où tu affiches les événements, tu peux maintenant utiliser :

```jsx
// Événements combinés (tes événements + Google + Outlook)
const allEvents = [...events, ...calendarSync.calendarEvents];

// Ou pour aujourd'hui seulement
const todayCalendarEvents = calendarSync.todayEvents;
```

---

### Étape 8 : Mettre à jour Vercel

Ajoute les variables d'environnement dans Vercel :

1. Va sur [vercel.com](https://vercel.com)
2. Ouvre ton projet todogame
3. **Settings** → **Environment Variables**
4. Ajoute :
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_REDIRECT_URI`

5. **Redéploie** le projet

---

## 🔧 Dépannage

### "Invalid redirect URI"
- Vérifie que l'URI dans Google Cloud Console correspond exactement à `https://todogame-app.vercel.app/auth/google/callback`

### "Token expired"
- Les tokens sont automatiquement rafraîchis, mais si ça ne marche pas, demande à l'utilisateur de se reconnecter

### Les événements ne s'affichent pas
- Vérifie que les tables Supabase sont créées
- Vérifie que les Edge Functions sont déployées
- Regarde les logs dans Supabase → Edge Functions → Logs

---

## 📱 Pour Outlook (plus tard)

Pour configurer Outlook, tu devras :

1. Créer une application dans [Azure Portal](https://portal.azure.com)
2. Configurer les permissions `Calendars.Read`
3. Ajouter les Edge Functions pour Outlook
4. Mettre à jour les variables d'environnement

Je t'aiderai quand tu seras prêt !

---

## ✅ Checklist

- [ ] Variables .env ajoutées
- [ ] Tables SQL créées dans Supabase
- [ ] Supabase CLI installé
- [ ] Edge Functions déployées
- [ ] react-router-dom installé
- [ ] main.jsx modifié
- [ ] useCalendarSync ajouté dans App.jsx
- [ ] CalendarSettings ajouté dans SettingsModal
- [ ] Variables Vercel configurées
- [ ] Redéploiement effectué
