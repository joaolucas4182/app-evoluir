import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export const auth = {
  signUp: async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: name,
          email,
        });
        
        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }
      }
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  getUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },
};

// Database helpers
export const db = {
  // Quiz responses
  saveQuizResponse: async (userId: string, answers: any, leadData: { name: string; email: string }) => {
    try {
      // Verificar se já existe resposta
      const { data: existing } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existing) {
        // Atualizar resposta existente
        return await supabase
          .from('quiz_responses')
          .update({
            answers,
            lead_name: leadData.name,
            lead_email: leadData.email,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
      
      // Criar nova resposta
      return await supabase.from('quiz_responses').insert({
        user_id: userId,
        answers,
        lead_name: leadData.name,
        lead_email: leadData.email,
      });
    } catch (error) {
      console.error('Erro ao salvar quiz:', error);
      return { data: null, error };
    }
  },

  // Goals
  getGoals: async (userId: string) => {
    try {
      return await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      return { data: [], error };
    }
  },

  createGoal: async (userId: string, goal: any) => {
    try {
      return await supabase.from('goals').insert({
        user_id: userId,
        ...goal,
      });
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      return { data: null, error };
    }
  },

  updateGoal: async (goalId: string, updates: any) => {
    try {
      return await supabase
        .from('goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', goalId);
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      return { data: null, error };
    }
  },

  // Daily tasks
  getDailyTasks: async (userId: string, date: string) => {
    try {
      return await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: true });
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      return { data: [], error };
    }
  },

  createDailyTask: async (userId: string, task: any) => {
    try {
      return await supabase.from('daily_tasks').insert({
        user_id: userId,
        completed: false,
        ...task,
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      return { data: null, error };
    }
  },

  updateTask: async (taskId: string, updates: any) => {
    try {
      return await supabase
        .from('daily_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return { data: null, error };
    }
  },

  // Daily progress
  getDailyProgress: async (userId: string, date: string) => {
    try {
      return await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
      return { data: null, error };
    }
  },

  upsertDailyProgress: async (userId: string, date: string, progress: any) => {
    try {
      return await supabase
        .from('daily_progress')
        .upsert({
          user_id: userId,
          date,
          ...progress,
        }, {
          onConflict: 'user_id,date'
        });
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      return { data: null, error };
    }
  },

  // Achievements
  getAchievements: async (userId: string) => {
    try {
      return await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      return { data: [], error };
    }
  },

  addAchievement: async (userId: string, achievement: any) => {
    try {
      return await supabase.from('achievements').insert({
        user_id: userId,
        earned_at: new Date().toISOString(),
        ...achievement,
      });
    } catch (error) {
      console.error('Erro ao adicionar conquista:', error);
      return { data: null, error };
    }
  },

  // Profile
  getProfile: async (userId: string) => {
    try {
      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return { data: null, error };
    }
  },

  createProfile: async (profile: { id: string; email: string | undefined; full_name: string }) => {
    try {
      return await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      return { data: null, error };
    }
  },

  updateProfile: async (userId: string, updates: any) => {
    try {
      return await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { data: null, error };
    }
  },
};
