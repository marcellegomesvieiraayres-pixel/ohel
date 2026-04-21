import React from 'react';
import { motion } from 'motion/react';
import { Users, DollarSign, Briefcase, Heart, ChevronRight, Activity, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PillarCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

const PillarCard: React.FC<PillarCardProps> = ({ title, description, icon, color, onClick, disabled }) => (
  <motion.button
    whileHover={!disabled ? { scale: 1.02, y: -4 } : {}}
    whileTap={!disabled ? { scale: 0.98 } : {}}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "relative overflow-hidden group p-6 rounded-2xl border border-border/50 bg-card text-left transition-all glow-blue flex flex-col h-64",
      disabled ? "opacity-60 grayscale cursor-not-allowed" : "hover:border-primary/50"
    )}
  >
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors", color)}>
      {disabled ? <Lock className="w-6 h-6" /> : icon}
    </div>
    <div className="flex-1">
      <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
    
    {!disabled ? (
      <div className="flex items-center gap-2 text-primary font-bold text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        Acessar Módulo <ChevronRight className="w-4 h-4" />
      </div>
    ) : (
      <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm mt-4">
        Apenas para Instituições <Lock className="w-3 h-3" />
      </div>
    )}
    
    {/* Decorative background element */}
    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
  </motion.button>
);

interface OrdemNoCaosProps {
  onNavigate: (view: any) => void;
  profileType: 'personal' | 'institutional';
}

export const OrdemNoCaos: React.FC<OrdemNoCaosProps> = ({ onNavigate, profileType }) => {
  const pillars = [
    {
      id: 'familiar',
      title: 'Familiar',
      description: 'Gestão da casa, finanças do lar, rotinas domésticas e eventos com quem você ama.',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      id: 'fitness',
      title: 'Pessoal',
      description: 'Hábitos diários, contador de passos, água, cardápio semanal e área fitness.',
      icon: <Activity className="w-8 h-8" />,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      id: 'profissional',
      title: 'Profissional',
      description: 'Gestão de equipe, finanças do trabalho, tickets, produtividade e metas.',
      icon: <Briefcase className="w-8 h-8" />,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      id: 'spiritual',
      title: 'Espiritual',
      description: 'Metas espirituais, devocionais, bíblia online e conexão com o propósito.',
      icon: <Heart className="w-8 h-8" />,
      color: 'bg-red-500/10 text-red-500',
    },
  ];

  return (
    <div className="space-y-12 py-6">
      <div className="flex flex-col gap-3 text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold tracking-tight uppercase">Ordem no Caos</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold opacity-70">Estrutura de Gestão</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.id}
            title={pillar.title}
            description={pillar.description}
            icon={pillar.icon}
            color={pillar.color}
            disabled={ pillar.id === 'profissional' && profileType === 'personal' }
            onClick={() => onNavigate(pillar.id)}
          />
        ))}
      </div>
    </div>
  );
};
