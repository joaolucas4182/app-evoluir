"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, User, TrendingUp, Target, Dumbbell, 
  Trophy, Flame, Award, MessageCircle, Play,
  ChevronRight, Calendar, Clock, Check, CreditCard,
  Zap, Shield, Star, X, ArrowRight, Sparkles, LogOut
} from "lucide-react";
import { auth, db, supabase } from "@/lib/supabase";

export default function EvoluirApp() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [quizStep, setQuizStep] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quizAnswers, setQuizAnswers] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        checkUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: authData, error: authError } = await auth.getUser();
      
      // Verificar se data existe e tem user
      if (authError || !authData || !authData.user) {
        console.log('Usuário não autenticado, redirecionando...');
        router.push('/auth');
        return;
      }
      
      const currentUser = authData.user;
      setUser(currentUser);
      
      // Buscar perfil - com tratamento de erro melhorado
      try {
        const { data: profileData, error: profileError } = await db.getProfile(currentUser.id);
        
        if (profileError) {
          console.log('Erro ao buscar perfil:', profileError);
          // Se perfil não existe, criar um novo
          if (profileError.code === 'PGRST116') {
            console.log('Perfil não encontrado, criando novo...');
            const { data: newProfile, error: createError } = await db.createProfile({
              id: currentUser.id,
              email: currentUser.email,
              full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]
            });
            
            if (createError) {
              console.error('Erro ao criar perfil:', createError);
            } else {
              setProfile(newProfile);
            }
          }
        } else if (profileData) {
          setProfile(profileData);
        }
      } catch (profileErr) {
        console.error('Erro ao processar perfil:', profileErr);
      }
      
      // Verificar se já completou o quiz
      try {
        const { data: quizData } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (quizData) {
          setShowOnboarding(false);
        }
      } catch (quizErr) {
        console.error('Erro ao verificar quiz:', quizErr);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/auth');
  };

  const handleQuizComplete = async (answers: any, leadData: any) => {
    if (user) {
      await db.saveQuizResponse(user.id, answers, leadData);
      setShowOnboarding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-[#00BFFF]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#00BFFF] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingQuiz 
        onComplete={handleQuizComplete}
        quizStep={quizStep} 
        setQuizStep={setQuizStep}
        quizAnswers={quizAnswers}
        setQuizAnswers={setQuizAnswers}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-[#00BFFF]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <span className="text-[#00BFFF]">Evoluir</span>
            </h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 bg-[#00BFFF]/10 px-3 sm:px-4 py-2 rounded-full border border-[#00BFFF]/20">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#00BFFF]" />
                <span className="text-sm sm:text-base font-semibold">12 dias</span>
              </div>
              <button 
                onClick={() => setActiveTab("perfil")}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#00BFFF]/20 to-[#00BFFF]/5 border border-[#00BFFF]/30 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#00BFFF]" />
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:scale-105 transition-transform"
                title="Sair"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 sm:pt-24 pb-24 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dashboard" && <Dashboard user={user} />}
          {activeTab === "perfil" && <Perfil user={user} profile={profile} />}
          {activeTab === "progresso" && <Progresso user={user} />}
          {activeTab === "metas" && <Metas user={user} />}
          {activeTab === "exercicios" && <Exercicios />}
          {activeTab === "pagamento" && <Pagamento />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-[#00BFFF]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-20 sm:h-24">
            <NavButton icon={Home} label="Início" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <NavButton icon={TrendingUp} label="Progresso" active={activeTab === "progresso"} onClick={() => setActiveTab("progresso")} />
            <NavButton icon={Target} label="Metas" active={activeTab === "metas"} onClick={() => setActiveTab("metas")} />
            <NavButton icon={CreditCard} label="Premium" active={activeTab === "pagamento"} onClick={() => setActiveTab("pagamento")} />
            <NavButton icon={User} label="Perfil" active={activeTab === "perfil"} onClick={() => setActiveTab("perfil")} />
          </div>
        </div>
      </nav>
    </div>
  );
}

function OnboardingQuiz({ onComplete, quizStep, setQuizStep, quizAnswers, setQuizAnswers, user }: any) {
  const [showLoading, setShowLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", email: "" });

  const quizData = [
    // Etapa 0 - Tela de Abertura
    {
      type: "welcome",
      title: "Descubra seu potencial!",
      subtitle: "Quanto você está preparado para evoluir?",
      description: "Leva apenas 3 minutos.",
      cta: "Comece o quiz"
    },
    // Etapa 1 - Idade
    {
      type: "question",
      question: "Qual é a sua idade?",
      options: ["18-25", "26-35", "36-45", "46+"],
      key: "age"
    },
    // Etapa 2 - Experiência
    {
      type: "question",
      question: "Você já utilizou algum app de desenvolvimento pessoal antes?",
      options: ["Sim", "Não"],
      key: "experience"
    },
    // Etapa 3 - Foco
    {
      type: "question",
      question: "Você está mais focado em desenvolvimento físico, mental ou ambos?",
      options: ["Físico", "Mental", "Ambos"],
      key: "focus"
    },
    // Etapa 4 - Educação
    {
      type: "education",
      title: "O desenvolvimento pessoal é uma jornada",
      description: "Acreditamos que cada pessoa pode superar desafios e alcançar seus objetivos."
    },
    // Etapa 5 - Obstáculo
    {
      type: "question",
      question: "Qual o maior obstáculo que você enfrenta para se desenvolver?",
      options: ["Falta de motivação", "Falta de tempo", "Medo de falhar", "Não sei"],
      key: "obstacle"
    },
    // Etapa 6 - Frequência
    {
      type: "question",
      question: "Com que frequência você pratica atividades para melhorar sua saúde mental?",
      options: ["Diariamente", "Semanalmente", "Raramente", "Nunca"],
      key: "frequency"
    },
    // Etapa 7 - Satisfação
    {
      type: "question",
      question: "Você se sente satisfeito com sua rotina diária?",
      options: ["Sim", "Não"],
      key: "satisfaction"
    },
    // Etapa 8 - Metas
    {
      type: "question",
      question: "Você já definiu metas para seu desenvolvimento pessoal?",
      options: ["Sim", "Não", "Pretendo fazer"],
      key: "goals"
    },
    // Etapa 9 - Disciplina
    {
      type: "question",
      question: "Você se considera uma pessoa disciplinada?",
      options: ["Muito", "Moderadamente", "Pouco", "Não sou"],
      key: "discipline"
    },
    // Etapa 10 - Explicação Científica
    {
      type: "education",
      title: "Pesquisas mostram que...",
      description: "A disciplina e a definição de metas são fundamentais para o crescimento pessoal."
    },
    // Etapa 11 - Sentimento
    {
      type: "question",
      question: "Como você se sente ao pensar em suas metas de desenvolvimento?",
      options: ["Animado", "Indiferente", "Sobrecarregado", "Desesperançoso"],
      key: "feeling"
    },
    // Etapa 12 - Motivação
    {
      type: "question",
      question: "Qual é a sua principal motivação para se desenvolver?",
      options: ["Saúde", "Carreira", "Relacionamentos", "Autoconhecimento"],
      key: "motivation"
    },
    // Etapa 13 - Mudança (resposta aberta)
    {
      type: "open",
      question: "O que você gostaria de mudar em sua vida?",
      placeholder: "Digite sua resposta aqui...",
      key: "change"
    },
    // Etapa 14 - Objetivo Emocional
    {
      type: "question",
      question: "Como você gostaria de se sentir ao atingir seus objetivos?",
      options: ["Confiante", "Feliz", "Realizado", "Aliviado"],
      key: "goalFeeling"
    },
    // Etapa 15 - Validação
    {
      type: "education",
      title: "Seus sentimentos são válidos",
      description: "Entendemos a importância disso nesta jornada."
    },
    // Etapa 16 - Horas
    {
      type: "question",
      question: "Quantas horas por semana você dedica a atividades de desenvolvimento pessoal?",
      options: ["0-3", "4-6", "7-10", "10+"],
      key: "hours"
    },
    // Etapa 17 - Autoridade
    {
      type: "education",
      title: "Milhares de usuários já transformaram suas vidas",
      description: "Com nosso app e queremos que você seja o próximo!"
    },
    // Etapa 18 - Captura de Lead
    {
      type: "lead",
      title: "Antes de revelarmos seus resultados...",
      description: "Que tal se inscrever para receber dicas exclusivas?",
      cta: "Quero receber dicas!"
    }
  ];

  const currentStep = quizData[quizStep];
  const totalSteps = quizData.length;

  const handleAnswer = (answer: string) => {
    if (currentStep.type === "question") {
      setQuizAnswers({ ...quizAnswers, [currentStep.key]: answer });
    }
    handleNext();
  };

  const handleOpenAnswer = (value: string) => {
    setQuizAnswers({ ...quizAnswers, [currentStep.key]: value });
  };

  const handleNext = () => {
    if (quizStep < totalSteps - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Após captura de lead, mostrar loading
      setShowLoading(true);
      setTimeout(() => {
        setShowLoading(false);
        setShowResults(true);
      }, 3000);
    }
  };

  const handleLeadSubmit = (e: any) => {
    e.preventDefault();
    handleNext();
  };

  const handleFinish = () => {
    onComplete(quizAnswers, leadData);
  };

  // Loading Screen
  if (showLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-[#00BFFF]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#00BFFF] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Analisando suas respostas...
          </h2>
          <p className="text-gray-400">Isso levará apenas alguns segundos.</p>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8">
          {/* Etapa 20 - Resultados Personalizados */}
          <div className="bg-gradient-to-br from-[#00BFFF]/10 to-transparent border border-[#00BFFF]/20 rounded-3xl p-8 mb-6">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#00BFFF]" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Seus Resultados Personalizados
              </h2>
              <p className="text-gray-400">Baseado nas suas respostas, identificamos suas áreas de foco</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <ResultCard 
                title="Desenvolvimento Físico"
                percentage={quizAnswers.focus === "Físico" || quizAnswers.focus === "Ambos" ? 85 : 45}
                description="Foco em exercícios e condicionamento"
              />
              <ResultCard 
                title="Desenvolvimento Mental"
                percentage={quizAnswers.focus === "Mental" || quizAnswers.focus === "Ambos" ? 90 : 50}
                description="Meditação, foco e mindfulness"
              />
              <ResultCard 
                title="Disciplina"
                percentage={quizAnswers.discipline === "Muito" ? 95 : quizAnswers.discipline === "Moderadamente" ? 70 : 40}
                description="Consistência e hábitos diários"
              />
              <ResultCard 
                title="Motivação"
                percentage={quizAnswers.feeling === "Animado" ? 90 : quizAnswers.feeling === "Indiferente" ? 50 : 30}
                description="Energia e entusiasmo"
              />
            </div>
          </div>

          {/* Etapa 21 - Benefícios */}
          <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-3xl p-8 mb-6">
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Com nosso app, você pode:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BenefitItem icon={Target} text="Aumentar sua disciplina" />
              <BenefitItem icon={Trophy} text="Definir e alcançar metas realistas" />
              <BenefitItem icon={Sparkles} text="Melhorar sua saúde mental e física" />
            </div>
          </div>

          {/* Etapa 22 - Prova Social */}
          <div className="bg-gradient-to-br from-[#00BFFF]/10 to-transparent border border-[#00BFFF]/20 rounded-3xl p-8 mb-6 text-center">
            <div className="text-5xl font-bold text-[#00BFFF] mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              85%
            </div>
            <p className="text-xl text-gray-300">
              Dos nossos usuários relatam melhorias significativas em suas vidas
            </p>
          </div>

          {/* Etapa 23 - Oferta Final */}
          <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-3xl p-8">
            <h3 className="text-3xl font-bold mb-3 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Pronto para evoluir?
            </h3>
            <p className="text-gray-400 text-center mb-8">
              Acesse nosso plano de assinatura e comece sua jornada agora!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <PlanCard 
                name="Plano Mensal"
                price="R$ 29,90"
                period="/mês"
                features={["Acesso completo", "Suporte prioritário", "Atualizações gratuitas"]}
              />
              <PlanCard 
                name="Plano Anual"
                price="R$ 299,90"
                period="/ano"
                badge="2 meses grátis"
                features={["Tudo do mensal", "Economia de 16%", "Bônus exclusivos"]}
                highlighted
              />
            </div>

            <button 
              onClick={handleFinish}
              className="w-full py-4 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-bold text-lg hover:bg-[#00BFFF]/90 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Começar agora
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Steps
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        {currentStep.type !== "welcome" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Passo {quizStep} de {totalSteps - 1}</span>
              <span className="text-sm text-[#00BFFF] font-semibold">{Math.round((quizStep / (totalSteps - 1)) * 100)}%</span>
            </div>
            <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00BFFF] to-[#0080FF] transition-all duration-500"
                style={{ width: `${(quizStep / (totalSteps - 1)) * 100}%`, boxShadow: '0 0 20px rgba(0,191,255,0.5)' }}
              />
            </div>
          </div>
        )}

        {/* Welcome Screen */}
        {currentStep.type === "welcome" && (
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#00BFFF]/20 rounded-3xl p-8 sm:p-12 text-center">
            <Sparkles className="w-20 h-20 mx-auto mb-6 text-[#00BFFF]" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {currentStep.title}
            </h1>
            <p className="text-xl text-gray-300 mb-3">{currentStep.subtitle}</p>
            <p className="text-gray-400 mb-8">{currentStep.description}</p>
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-bold text-lg hover:bg-[#00BFFF]/90 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              {currentStep.cta}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Question Screen */}
        {currentStep.type === "question" && (
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#00BFFF]/20 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {currentStep.question}
            </h2>
            <div className="space-y-4">
              {currentStep.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="w-full p-5 bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-2xl text-left hover:border-[#00BFFF] hover:bg-[#00BFFF]/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-medium">{option}</span>
                    <ChevronRight className="w-5 h-5 text-[#00BFFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Open Question */}
        {currentStep.type === "open" && (
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#00BFFF]/20 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {currentStep.question}
            </h2>
            <textarea
              placeholder={currentStep.placeholder}
              onChange={(e) => handleOpenAnswer(e.target.value)}
              className="w-full p-4 bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-2xl text-white placeholder-gray-500 focus:border-[#00BFFF] focus:outline-none transition-all min-h-[150px] resize-none"
            />
            <button
              onClick={handleNext}
              className="w-full mt-4 py-4 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-bold hover:bg-[#00BFFF]/90 transition-all hover:scale-105"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Education Screen */}
        {currentStep.type === "education" && (
          <div className="bg-gradient-to-br from-[#00BFFF]/10 to-transparent border border-[#00BFFF]/20 rounded-3xl p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#00BFFF]/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#00BFFF]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {currentStep.title}
            </h2>
            <p className="text-lg text-gray-300 mb-8">{currentStep.description}</p>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-bold hover:bg-[#00BFFF]/90 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Lead Capture */}
        {currentStep.type === "lead" && (
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#00BFFF]/20 rounded-3xl p-8 sm:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {currentStep.title}
              </h2>
              <p className="text-gray-400">{currentStep.description}</p>
            </div>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                required
                className="w-full p-4 bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-2xl text-white placeholder-gray-500 focus:border-[#00BFFF] focus:outline-none transition-all"
              />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                required
                className="w-full p-4 bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-2xl text-white placeholder-gray-500 focus:border-[#00BFFF] focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="w-full py-4 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-bold hover:bg-[#00BFFF]/90 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                {currentStep.cta}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Back Button */}
        {quizStep > 0 && currentStep.type !== "welcome" && (
          <button
            onClick={() => setQuizStep(quizStep - 1)}
            className="mt-4 text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}

function ResultCard({ title, percentage, description }: any) {
  return (
    <div className="bg-[#0D0D0D] border border-[#00BFFF]/20 rounded-2xl p-6">
      <h4 className="text-lg font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{title}</h4>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#00BFFF] to-[#0080FF]"
            style={{ width: `${percentage}%`, boxShadow: '0 0 10px rgba(0,191,255,0.5)' }}
          />
        </div>
        <span className="text-xl font-bold text-[#00BFFF]">{percentage}%</span>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function BenefitItem({ icon: Icon, text }: any) {
  return (
    <div className="flex items-center gap-3 p-4 bg-[#0D0D0D] rounded-xl border border-[#00BFFF]/10">
      <div className="w-12 h-12 rounded-full bg-[#00BFFF]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-[#00BFFF]" />
      </div>
      <span className="font-medium">{text}</span>
    </div>
  );
}

function PlanCard({ name, price, period, badge, features, highlighted }: any) {
  return (
    <div className={`p-6 rounded-2xl border-2 ${
      highlighted 
        ? "bg-gradient-to-br from-[#00BFFF]/20 to-transparent border-[#00BFFF]" 
        : "bg-[#0D0D0D] border-[#00BFFF]/20"
    }`}>
      {badge && (
        <div className="inline-block px-3 py-1 bg-[#00BFFF] text-[#0D0D0D] rounded-full text-xs font-bold mb-4">
          {badge}
        </div>
      )}
      <h4 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{name}</h4>
      <div className="mb-4">
        <span className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{price}</span>
        <span className="text-gray-400">{period}</span>
      </div>
      <ul className="space-y-2">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-[#00BFFF]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pagamento() {
  const [selectedPlan, setSelectedPlan] = useState("pro");

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Evolua para o <span className="text-[#00BFFF]">Premium</span>
        </h2>
        <p className="text-gray-400 text-base sm:text-lg">
          Desbloqueie todo o potencial da sua jornada
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Gratuito
            </h3>
            <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              R$ 0
            </div>
            <p className="text-gray-400 text-sm">Para começar</p>
          </div>
          <ul className="space-y-3 mb-6">
            <Feature text="Acesso básico ao dashboard" />
            <Feature text="3 exercícios por dia" />
            <Feature text="Tracking de progresso básico" />
            <Feature text="Comunidade limitada" />
          </ul>
          <button className="w-full py-3 bg-[#1A1A1A] border border-[#00BFFF]/20 rounded-xl font-semibold hover:border-[#00BFFF]/40 transition-all">
            Plano Atual
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`bg-gradient-to-br from-[#00BFFF]/20 to-[#0D0D0D] border-2 rounded-3xl p-6 sm:p-8 relative ${
          selectedPlan === "pro" ? "border-[#00BFFF]" : "border-[#00BFFF]/30"
        }`}>
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-[#00BFFF] text-[#0D0D0D] px-4 py-1 rounded-full text-sm font-bold">
              MAIS POPULAR
            </span>
          </div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Pro
            </h3>
            <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              R$ 49
              <span className="text-lg text-gray-400">/mês</span>
            </div>
            <p className="text-gray-400 text-sm">Para evoluir constantemente</p>
          </div>
          <ul className="space-y-3 mb-6">
            <Feature text="Tudo do plano gratuito" highlighted />
            <Feature text="Exercícios ilimitados" highlighted />
            <Feature text="Planos personalizados com IA" highlighted />
            <Feature text="Análises avançadas" highlighted />
            <Feature text="Comunidade completa" highlighted />
            <Feature text="Suporte prioritário" highlighted />
          </ul>
          <button 
            onClick={() => setSelectedPlan("pro")}
            className="w-full py-3 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-bold hover:bg-[#00BFFF]/90 transition-all hover:scale-105"
          >
            Assinar Pro
          </button>
        </div>

        {/* Elite Plan */}
        <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Elite
            </h3>
            <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              R$ 99
              <span className="text-lg text-gray-400">/mês</span>
            </div>
            <p className="text-gray-400 text-sm">Para máxima performance</p>
          </div>
          <ul className="space-y-3 mb-6">
            <Feature text="Tudo do plano Pro" />
            <Feature text="Coach pessoal dedicado" />
            <Feature text="Consultas 1-on-1 mensais" />
            <Feature text="Planos nutricionais" />
            <Feature text="Acesso antecipado a features" />
            <Feature text="Grupo VIP exclusivo" />
          </ul>
          <button 
            onClick={() => setSelectedPlan("elite")}
            className="w-full py-3 bg-[#1A1A1A] border border-[#00BFFF]/20 rounded-xl font-semibold hover:border-[#00BFFF]/40 transition-all"
          >
            Assinar Elite
          </button>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-br from-[#00BFFF]/10 to-transparent border border-[#00BFFF]/20 rounded-3xl p-6 sm:p-8">
        <h3 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Por que escolher Premium?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <BenefitCard 
            icon={Zap}
            title="Resultados Rápidos"
            description="Alcance seus objetivos 3x mais rápido com IA personalizada"
          />
          <BenefitCard 
            icon={Shield}
            title="Garantia de 30 dias"
            description="Não gostou? Devolvemos 100% do seu dinheiro"
          />
          <BenefitCard 
            icon={Star}
            title="Suporte Premium"
            description="Equipe dedicada disponível 24/7 para você"
          />
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-3xl p-6 sm:p-8">
        <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Formas de Pagamento
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PaymentMethod name="Cartão de Crédito" />
          <PaymentMethod name="PIX" />
          <PaymentMethod name="Boleto" />
          <PaymentMethod name="PayPal" />
        </div>
      </div>
    </div>
  );
}

function Feature({ text, highlighted }: any) {
  return (
    <li className="flex items-start gap-2">
      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${highlighted ? "text-[#00BFFF]" : "text-gray-400"}`} />
      <span className="text-sm">{text}</span>
    </li>
  );
}

function BenefitCard({ icon: Icon, title, description }: any) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00BFFF]/10 border border-[#00BFFF]/20 flex items-center justify-center">
        <Icon className="w-8 h-8 text-[#00BFFF]" />
      </div>
      <h4 className="font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function PaymentMethod({ name }: any) {
  return (
    <div className="p-4 bg-[#0D0D0D] border border-[#00BFFF]/10 rounded-xl text-center hover:border-[#00BFFF]/30 transition-all cursor-pointer">
      <CreditCard className="w-6 h-6 mx-auto mb-2 text-[#00BFFF]" />
      <span className="text-xs font-medium">{name}</span>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 sm:gap-2 transition-all ${
        active ? "text-[#00BFFF]" : "text-gray-500 hover:text-gray-300"
      }`}
    >
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${active ? "drop-shadow-[0_0_8px_rgba(0,191,255,0.5)]" : ""}`} />
      <span className="text-xs sm:text-sm font-medium">{label}</span>
    </button>
  );
}

function Dashboard({ user }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await db.getDailyTasks(user.id, today);
      
      if (error) {
        console.error('Erro ao carregar tarefas:', error);
        setLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        setTasks(data);
      } else {
        // Criar tarefas padrão apenas uma vez
        const defaultTasks = [
          { title: "Meditação matinal", duration: "10 min", date: today },
          { title: "Treino de força", duration: "45 min", date: today },
          { title: "Leitura", duration: "20 min", date: today },
          { title: "Diário de gratidão", duration: "5 min", date: today },
          { title: "Caminhada noturna", duration: "30 min", date: today },
        ];
        
        const promises = defaultTasks.map(task => db.createDailyTask(user.id, task));
        await Promise.all(promises);
        
        // Recarregar tarefas
        const { data: newData } = await db.getDailyTasks(user.id, today);
        if (newData) {
          setTasks(newData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await db.updateTask(taskId, { 
      completed: !completed,
      completed_at: !completed ? new Date().toISOString() : null
    });
    loadTasks();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#00BFFF]/10 to-transparent border border-[#00BFFF]/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Bem-vindo de volta! 👋
        </h2>
        <p className="text-sm sm:text-base text-gray-400">Continue sua jornada de evolução</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Trophy} label="Conquistas" value="24" color="#00BFFF" />
        <StatCard icon={Flame} label="Sequência" value="12 dias" color="#FF6B00" />
        <StatCard icon={Target} label="Metas" value="8/12" color="#00B8FF" />
        <StatCard icon={Award} label="Nível" value="Pro" color="#FFD700" />
      </div>

      {/* Daily Tasks */}
      <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Tarefas Diárias
          </h3>
          <span className="text-xs sm:text-sm text-gray-400">
            {tasks.filter(t => t.completed).length}/{tasks.length} completas
          </span>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <p className="text-gray-400 text-center py-4">Carregando tarefas...</p>
          ) : (
            tasks.map((task) => (
              <TaskItem 
                key={task.id}
                title={task.title} 
                completed={task.completed}
                time={task.duration}
                onToggle={() => toggleTask(task.id, task.completed)}
              />
            ))
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ProgressCard title="Físico" percentage={75} color="#00BFFF" />
        <ProgressCard title="Mental" percentage={82} color="#00B8FF" />
      </div>

      {/* Community Feed */}
      <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Comunidade
          </h3>
          <button className="text-xs sm:text-sm text-[#00BFFF] hover:underline">Ver tudo</button>
        </div>
        <div className="space-y-4">
          <FeedItem user="Maria Silva" achievement="Completou 30 dias de sequência!" time="2h atrás" />
          <FeedItem user="João Pedro" achievement="Atingiu meta de 10km corridos" time="5h atrás" />
          <FeedItem user="Ana Costa" achievement="Novo recorde pessoal no treino!" time="1d atrás" />
        </div>
      </div>
    </div>
  );
}

function Perfil({ user, profile }: any) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#00BFFF]/10 to-transparent border border-[#00BFFF]/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#0080FF] flex items-center justify-center text-3xl sm:text-4xl font-bold">
            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {profile?.full_name || user?.email}
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
              Membro desde {new Date(user?.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 bg-[#00BFFF]/20 text-[#00BFFF] rounded-full text-xs sm:text-sm font-semibold border border-[#00BFFF]/30">
                Nível Pro
              </span>
              <span className="px-3 py-1 bg-[#FF6B00]/20 text-[#FF6B00] rounded-full text-xs sm:text-sm font-semibold border border-[#FF6B00]/30">
                12 dias de sequência
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Conquistas
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          <Badge icon="🔥" label="Sequência 7d" />
          <Badge icon="💪" label="Força" />
          <Badge icon="🧘" label="Zen" />
          <Badge icon="📚" label="Leitor" />
          <Badge icon="🏃" label="Corredor" />
          <Badge icon="⭐" label="Estrela" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <ProfileStat label="Total de Treinos" value="156" />
        <ProfileStat label="Horas Investidas" value="234h" />
        <ProfileStat label="Metas Concluídas" value="42" />
      </div>
    </div>
  );
}

function Progresso({ user }: any) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Seu Progresso
      </h2>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Evolução Física
          </h3>
          <div className="space-y-4 sm:space-y-6">
            <ProgressBar label="Força" value={75} color="#00BFFF" />
            <ProgressBar label="Resistência" value={68} color="#00B8FF" />
            <ProgressBar label="Flexibilidade" value={82} color="#FFD700" />
            <ProgressBar label="Cardio" value={71} color="#FF6B00" />
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Evolução Mental
          </h3>
          <div className="space-y-4 sm:space-y-6">
            <ProgressBar label="Foco" value={88} color="#00BFFF" />
            <ProgressBar label="Meditação" value={79} color="#00B8FF" />
            <ProgressBar label="Leitura" value={65} color="#FFD700" />
            <ProgressBar label="Gratidão" value={92} color="#FF6B00" />
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Atividade Semanal
        </h3>
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 sm:h-64">
          <WeekBar day="Seg" height={65} />
          <WeekBar day="Ter" height={80} />
          <WeekBar day="Qua" height={45} />
          <WeekBar day="Qui" height={90} />
          <WeekBar day="Sex" height={75} />
          <WeekBar day="Sáb" height={55} />
          <WeekBar day="Dom" height={70} />
        </div>
      </div>
    </div>
  );
}

function Metas({ user }: any) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      const { data, error } = await db.getGoals(user.id);
      
      if (error) {
        console.error('Erro ao carregar metas:', error);
        setLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        setGoals(data);
      } else {
        // Criar metas padrão apenas uma vez
        const defaultGoals = [
          {
            title: "Correr 100km este mês",
            target_value: 100,
            current_value: 67,
            unit: "km",
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            color: "#00BFFF"
          },
          {
            title: "Meditar 30 dias seguidos",
            target_value: 30,
            current_value: 12,
            unit: "dias",
            deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            color: "#00B8FF"
          },
          {
            title: "Ler 5 livros",
            target_value: 5,
            current_value: 3,
            unit: "livros",
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            color: "#FFD700"
          },
          {
            title: "Perder 5kg",
            target_value: 5,
            current_value: 4,
            unit: "kg",
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            color: "#FF6B00"
          },
        ];
        
        const promises = defaultGoals.map(goal => db.createGoal(user.id, goal));
        await Promise.all(promises);
        
        // Recarregar metas
        const { data: newData } = await db.getGoals(user.id);
        if (newData) {
          setGoals(newData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Metas e Objetivos
        </h2>
        <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-[#00BFFF] text-[#0D0D0D] rounded-xl font-semibold hover:bg-[#00BFFF]/90 transition-all hover:scale-105">
          + Nova Meta
        </button>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-400 text-center py-8">Carregando metas...</p>
        ) : (
          goals.filter(g => !g.completed).map((goal) => (
            <GoalCard 
              key={goal.id}
              title={goal.title}
              progress={Math.round((goal.current_value / goal.target_value) * 100)}
              current={`${goal.current_value}${goal.unit}`}
              target={`${goal.target_value}${goal.unit}`}
              deadline={`${Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias restantes`}
              color={goal.color}
            />
          ))
        )}
      </div>

      {/* Completed Goals */}
      <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Metas Concluídas
        </h3>
        <div className="space-y-3">
          {goals.filter(g => g.completed).length > 0 ? (
            goals.filter(g => g.completed).map((goal) => (
              <CompletedGoal 
                key={goal.id}
                title={goal.title} 
                date={new Date(goal.updated_at).toLocaleDateString('pt-BR')}
              />
            ))
          ) : (
            <>
              <CompletedGoal title="Treinar 20 dias no mês" date="Há 2 dias" />
              <CompletedGoal title="Beber 2L de água diariamente" date="Há 1 semana" />
              <CompletedGoal title="Dormir 8h por noite" date="Há 2 semanas" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Exercicios() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Exercícios e Práticas
      </h2>

      {/* Categories */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
        <CategoryPill label="Todos" active />
        <CategoryPill label="Físico" />
        <CategoryPill label="Mental" />
        <CategoryPill label="Cardio" />
        <CategoryPill label="Força" />
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <ExerciseCard 
          title="Treino HIIT"
          duration="30 min"
          difficulty="Intermediário"
          category="Cardio"
          image="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop"
        />
        <ExerciseCard 
          title="Meditação Guiada"
          duration="15 min"
          difficulty="Iniciante"
          category="Mental"
          image="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop"
        />
        <ExerciseCard 
          title="Yoga Flow"
          duration="45 min"
          difficulty="Intermediário"
          category="Flexibilidade"
          image="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"
        />
        <ExerciseCard 
          title="Musculação"
          duration="60 min"
          difficulty="Avançado"
          category="Força"
          image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"
        />
        <ExerciseCard 
          title="Corrida"
          duration="40 min"
          difficulty="Intermediário"
          category="Cardio"
          image="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop"
        />
        <ExerciseCard 
          title="Respiração"
          duration="10 min"
          difficulty="Iniciante"
          category="Mental"
          image="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop"
        />
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#00BFFF]/30 transition-all hover:scale-105">
      <Icon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3" style={{ color }} />
      <p className="text-xs sm:text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{value}</p>
    </div>
  );
}

function TaskItem({ title, completed, time, onToggle }: any) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0D0D0D] rounded-xl border border-[#00BFFF]/10 hover:border-[#00BFFF]/30 transition-all">
      <button
        onClick={onToggle}
        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          completed ? "bg-[#00BFFF] border-[#00BFFF]" : "border-gray-600 hover:border-[#00BFFF]"
        }`}
      >
        {completed && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-[#0D0D0D]" />}
      </button>
      <div className="flex-1">
        <p className={`text-sm sm:text-base font-medium ${completed ? "line-through text-gray-500" : ""}`}>{title}</p>
      </div>
      <span className="text-xs sm:text-sm text-gray-500">{time}</span>
    </div>
  );
}

function ProgressCard({ title, percentage, color }: any) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {title}
      </h3>
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="#1A1A1A"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.83} 283`}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(0,191,255,0.5)]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

function FeedItem({ user, achievement, time }: any) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0D0D0D] rounded-xl border border-[#00BFFF]/10 hover:border-[#00BFFF]/30 transition-all">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#0080FF] flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0">
        {user.split(" ").map((n: string) => n[0]).join("")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-semibold mb-1">{user}</p>
        <p className="text-xs sm:text-sm text-gray-400 mb-2">{achievement}</p>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
          <span>{time}</span>
          <button className="flex items-center gap-1 hover:text-[#00BFFF] transition-colors">
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Comentar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-[#0D0D0D] rounded-xl border border-[#00BFFF]/10 hover:border-[#00BFFF]/30 transition-all hover:scale-105">
      <span className="text-2xl sm:text-3xl">{icon}</span>
      <span className="text-xs text-center text-gray-400">{label}</span>
    </div>
  );
}

function ProfileStat({ label, value }: any) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center">
      <p className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#00BFFF' }}>
        {value}
      </p>
      <p className="text-sm sm:text-base text-gray-400">{label}</p>
    </div>
  );
}

function ProgressBar({ label, value, color }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm sm:text-base font-medium">{label}</span>
        <span className="text-sm sm:text-base font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 sm:h-3 bg-[#0D0D0D] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  );
}

function WeekBar({ day, height }: any) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="w-full bg-[#0D0D0D] rounded-t-lg overflow-hidden relative" style={{ height: `${height}%` }}>
        <div 
          className="absolute bottom-0 w-full bg-gradient-to-t from-[#00BFFF] to-[#00BFFF]/50 rounded-t-lg"
          style={{ height: '100%', boxShadow: '0 0 20px rgba(0,191,255,0.3)' }}
        />
      </div>
      <span className="text-xs sm:text-sm text-gray-500">{day}</span>
    </div>
  );
}

function GoalCard({ title, progress, current, target, deadline, color }: any) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 hover:border-[#00BFFF]/30 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{deadline}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg sm:text-xl font-bold" style={{ color }}>{current}</p>
          <p className="text-xs sm:text-sm text-gray-500">de {target}</p>
        </div>
      </div>
      <div className="h-2 sm:h-3 bg-[#0D0D0D] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  );
}

function CompletedGoal({ title, date }: any) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#0D0D0D] rounded-xl border border-[#00BFFF]/20">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#00BFFF]/20 flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#00BFFF]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-medium">{title}</p>
        <p className="text-xs sm:text-sm text-gray-500">{date}</p>
      </div>
    </div>
  );
}

function CategoryPill({ label, active }: any) {
  return (
    <button className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      active 
        ? "bg-[#00BFFF] text-[#0D0D0D]" 
        : "bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#00BFFF]/10"
    }`}>
      {label}
    </button>
  );
}

function ExerciseCard({ title, duration, difficulty, category, image }: any) {
  return (
    <div className="bg-[#1A1A1A] border border-[#00BFFF]/10 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-[#00BFFF]/30 transition-all hover:scale-105 group">
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent" />
        <button className="absolute top-3 right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00BFFF]/20 backdrop-blur-sm border border-[#00BFFF]/30 flex items-center justify-center hover:bg-[#00BFFF] transition-all group">
          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[#00BFFF] group-hover:text-[#0D0D0D]" />
        </button>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {title}
        </h3>
        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{duration}</span>
          </div>
          <span>•</span>
          <span>{difficulty}</span>
        </div>
        <div className="mt-3">
          <span className="px-2 sm:px-3 py-1 bg-[#00BFFF]/10 text-[#00BFFF] rounded-full text-xs font-medium border border-[#00BFFF]/20">
            {category}
          </span>
        </div>
      </div>
    </div>
  );
}
