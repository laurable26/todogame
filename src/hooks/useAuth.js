import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsLoggedIn(true);
      }
      setAuthLoading(false);
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        setIsLoggedIn(true);
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleRegister = async (email, password, pseudo) => {
    try {
      // 0. Vérifier que le pseudo est unique
      const { data: existingPseudo } = await supabase
        .from('profiles')
        .select('pseudo')
        .eq('pseudo', pseudo.toLowerCase())
        .single();
      
      if (existingPseudo) {
        return { success: false, error: 'Ce pseudo est déjà pris' };
      }

      // 1. Créer le compte auth
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            pseudo: pseudo,
          }
        }
      });
      
      if (error) {
        console.error('Erreur signup:', error);
        throw error;
      }
      
      if (data.user) {
        // 2. Créer le profil (avec upsert pour éviter les doublons)
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          pseudo: pseudo.toLowerCase(),
          avatar: '🎮',
          avatar_bg: 'from-slate-500 to-slate-700',
          level: 1,
          xp: 0,
          xp_to_next: 100,
          potatoes: 800,
          pq_season: 0,
          pq_total: 0,
          tasks_completed: 0,
        }, { onConflict: 'id' });

        if (profileError) {
          console.error('Erreur création profil:', profileError);
        }

        // 3. Créer les coffres
        const { error: chestsError } = await supabase.from('chests').upsert({
          user_id: data.user.id,
          bronze: 0,
          silver: 0,
          gold: 0,
          legendary: 0,
        }, { onConflict: 'user_id' });

        if (chestsError) {
          console.error('Erreur création coffres:', chestsError);
        }

        setSupabaseUser(data.user);
        return { success: true, user: data.user };
      }
      
      return { success: false, error: 'Erreur lors de la création du compte' };
    } catch (error) {
      console.error('Erreur complète:', error);
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setAuthMode('login');
    setSupabaseUser(null);
  };

  return {
    isLoggedIn,
    setIsLoggedIn,
    authMode,
    setAuthMode,
    authLoading,
    supabaseUser,
    handleLogin,
    handleRegister,
    handleLogout,
  };
};
