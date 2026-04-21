import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Shield, Crown, ArrowRight, User as UserIcon, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { PLAN_LIMITS, MEMBER_UPGRADE_PRICE } from '@/types';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PERSONAL_PLANS: PlanData[] = [
  {
    id: 'PERSONAL_BASIC',
    name: 'PESSOAL BÁSICO',
    basePrice: '49,90',
    description: 'Ideal para organização pessoal e pequenas prioridades.',
    features: [
      'Matriz de Eisenhower Pro',
      'Minhas Tarefas + Ordem no Caos',
      'Até 2 Membros Convidados',
      'Gestão de Prioridades',
      'Sincronização em Tempo Real'
    ],
    icon: Zap,
    color: 'from-slate-500 to-blue-600',
    lightColor: 'bg-blue-500/10',
    textColor: 'text-blue-600'
  },
  {
    id: 'PERSONAL_INTERMEDIATE',
    name: 'PESSOAL INTERMEDIÁRIO',
    basePrice: '69,90',
    description: 'A solução ideal para quem busca foco e conhecimento.',
    features: [
      'Tudo do Plano Básico',
      'Acesso à Biblioteca OHEL',
      'Até 5 Membros Convidados',
      'Modo Foco Pomodoro',
      'Suporte via Chat'
    ],
    icon: Shield,
    color: 'from-purple-600 to-blue-600',
    lightColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    popular: true
  },
  {
    id: 'PERSONAL_ADVANCED',
    name: 'PESSOAL AVANÇADO',
    basePrice: '99,90',
    description: 'Máxima potência para sua jornada de crescimento pessoal.',
    features: [
      'Tudo do Plano Intermediário',
      'Módulo de Missões & Metas',
      'Até 10 Membros Convidados',
      'Logística & Mapa Interativo',
      'Suporte Prioritário 24/7'
    ],
    icon: Crown,
    color: 'from-amber-500 to-emerald-600',
    lightColor: 'bg-amber-500/10',
    textColor: 'text-amber-600'
  }
];

interface PlanData {
  id: string;
  name: string;
  basePrice: string;
  isCustom?: boolean;
  description: string;
  features: string[];
  icon: any;
  color: string;
  lightColor: string;
  textColor: string;
  popular?: boolean;
}

const INSTITUTION_PLANS: PlanData[] = [
  {
    id: 'INSTITUTION_BASIC',
    name: 'INSTITUCIONAL BÁSICO',
    basePrice: '149,90',
    description: 'Gestão completa para pequenas instituições.',
    features: [
      'Painel de Gestão Completo',
      'Até 25 Membros na Equipe',
      'Logística & Biblioteca',
      'Sistema de Missões',
      'Notificações em Tempo Real'
    ],
    icon: Shield,
    color: 'from-blue-600 to-indigo-700',
    lightColor: 'bg-blue-500/10',
    textColor: 'text-blue-600'
  },
  {
    id: 'INSTITUTION_INTERMEDIATE',
    name: 'INSTITUCIONAL INTERMEDIÁRIO',
    basePrice: '449,90',
    description: 'Potência total para instituições em crescimento.',
    features: [
      'Até 75 Membros na Equipe',
      'Todas as Funcionalidades Premium',
      'Gestão de Múltiplos Grupos',
      'Relatórios Estratégicos',
      'Suporte VIP Dedicado'
    ],
    icon: Crown,
    color: 'from-purple-600 to-indigo-800',
    lightColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    popular: true
  },
  {
    id: 'INSTITUTION_ADVANCED',
    name: 'INSTITUCIONAL AVANÇADO',
    basePrice: 'A COMBINAR',
    isCustom: true,
    description: 'Solução sob medida para grandes ecossistemas.',
    features: [
      'Membros ILIMITADOS',
      'Customização de Marca (White Label)',
      'API Integrada de WhatsApp',
      'Consultoria de Implantação',
      'SLA de Atendimento 1h'
    ],
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    lightColor: 'bg-amber-500/10',
    textColor: 'text-amber-600'
  }
];

interface PlanSelectorProps {
  onUpgrade?: (planId: string) => void;
  currentPlan?: string;
  hasAdminDiscount?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ onUpgrade, currentPlan, hasAdminDiscount }) => {
  const { userData } = useAuth();
  const [dbPricing, setDbPricing] = useState<any>(null);
  
  const isMember = userData?.institutionId && userData?.role === 'MEMBER';
  const isOwner = userData?.type === 'institution_owner' || userData?.role === 'ADMIN';
  
  const [selectedType, setSelectedType] = useState<'PERSONAL' | 'INSTITUTION'>(
    isOwner ? 'INSTITUTION' : 'PERSONAL'
  );

  // Sync with Firestore Pricing
  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pricing'), (snap) => {
      if (snap.exists()) setDbPricing(snap.data());
    });
    return () => unsub();
  }, []);

  const getPrice = (id: string, fallback: string) => {
    return dbPricing?.[id]?.price || fallback;
  };

  const plans = (selectedType === 'PERSONAL' ? PERSONAL_PLANS : INSTITUTION_PLANS).map(p => ({
    ...p,
    basePrice: getPrice(p.id, p.basePrice)
  }));

  const upgradePrice = dbPricing?.MEMBER_UPGRADE?.price || MEMBER_UPGRADE_PRICE;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 md:px-8 space-y-12">
      {/* Banner de Upgrade para Membros */}
      {isMember && (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden shadow-2xl border-none">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-1 font-black tracking-widest text-[10px]">
                UPGRADE EXCLUSIVO
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter">DESEJA SUA PRÓPRIA ORGANIZAÇÃO PESSOAL?</h2>
              <p className="text-white/80 font-bold max-w-xl text-sm md:text-base">
                Como membro, você pode adicionar sua jornada pessoal por apenas <span className="text-white font-black">R$ {upgradePrice}</span>/mês.
              </p>
            </div>
            <Button 
              className="bg-white text-blue-700 hover:bg-blue-50 h-16 px-8 rounded-2xl font-black tracking-widest text-xs shadow-xl active:scale-95 transition-all"
              onClick={() => setSelectedType('PERSONAL')}
            >
              FAZER UPGRADE AGORA
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Seletor de Perfil (somente se não for owner fixo ou se quiser trocar visualização) */}
      {!isOwner && !isMember && (
        <div className="flex justify-center">
          <div className="bg-muted p-1.5 rounded-2xl flex gap-1.5 shadow-inner">
            <Button
              variant={selectedType === 'PERSONAL' ? 'default' : 'ghost'}
              className={cn("rounded-xl font-bold gap-2", selectedType === 'PERSONAL' && "shadow-lg")}
              onClick={() => setSelectedType('PERSONAL')}
            >
              <UserIcon className="w-4 h-4" />
              Plano Pessoal (CPF)
            </Button>
            <Button
              variant={selectedType === 'INSTITUTION' ? 'default' : 'ghost'}
              className={cn("rounded-xl font-bold gap-2", selectedType === 'INSTITUTION' && "shadow-lg")}
              onClick={() => setSelectedType('INSTITUTION')}
            >
              <Building2 className="w-4 h-4" />
              Plano Institucional (CNPJ)
            </Button>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="text-center space-y-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 mb-2">MODO GESTOR</Badge>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Planos Institucionais Ativos</h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          
          return (
            <Card key={plan.id} className={cn(
              "relative flex flex-col transition-all duration-500 hover:translate-y-[-8px] border-2 h-full",
              plan.popular ? "border-primary shadow-2xl shadow-primary/20 z-10 ring-4 ring-primary/10" : "border-border hover:border-primary/30",
              isCurrent && "border-emerald-500 bg-emerald-500/5 shadow-none"
            )}>
              <div className={cn(
                "absolute -top-3 left-0 right-0 h-10 flex items-center justify-center rounded-t-xl z-20 shadow-lg",
                plan.id.includes('BASIC') ? "bg-slate-600" : 
                plan.id.includes('INTERMEDIATE') ? "bg-purple-600" : "bg-amber-600"
              )}>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                  30 Dias Totalmente Grátis
                </span>
              </div>

              {plan.popular && (
                <div className="absolute top-10 right-4 z-20">
                  <Badge className="bg-primary text-primary-foreground px-3 py-0.5 font-black text-[8px] tracking-widest shadow-lg animate-bounce">
                    RECOMENDADO
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-14 pb-4 space-y-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto shadow-inner transform group-hover:rotate-6 transition-transform duration-500",
                  plan.color
                )}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">{plan.name}</CardTitle>
                </div>

                <CardDescription className="text-xs font-bold leading-tight px-4 h-12 flex items-center justify-center text-center opacity-80">
                  {plan.description}
                </CardDescription>

                <div className="pt-6 pb-2 border-y border-dashed border-border/60">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-baseline gap-1">
                      {!plan.isCustom && <span className="text-muted-foreground text-[10px] font-black self-start mt-1 uppercase tracking-widest">R$</span>}
                      <span className={cn("font-black tracking-tighter italic", plan.isCustom ? "text-3xl" : "text-5xl")}>
                        {plan.basePrice}
                      </span>
                      {!plan.isCustom && <span className="text-muted-foreground text-[10px] font-black self-end mb-1 uppercase tracking-widest">/mês</span>}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-8 pb-8 px-8">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-4 text-xs font-bold leading-tight">
                      <div className={cn(
                        "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
                        plan.lightColor,
                        plan.textColor
                      )}>
                        <Check className="w-3.5 h-3.5 stroke-[4px]" />
                      </div>
                      <span className="opacity-90 pt-0.5">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-0 pb-10 px-8">
                <Button 
                  variant={isCurrent ? 'outline' : 'default'} 
                  className={cn(
                    "w-full h-16 rounded-3xl font-black tracking-[0.25em] uppercase text-[11px] border-2 transition-all duration-300 transform active:scale-95 group",
                    !isCurrent ? cn("bg-gradient-to-r shadow-2xl hover:shadow-primary/50 text-white", plan.color) : "border-emerald-500 text-emerald-500 hover:bg-emerald-50"
                  )}
                  disabled={isCurrent}
                  onClick={() => onUpgrade?.(plan.id)}
                >
                  {isCurrent ? (
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Plano Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {plan.isCustom ? 'Falar com Consultor' : 'Começar teste grátis'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
