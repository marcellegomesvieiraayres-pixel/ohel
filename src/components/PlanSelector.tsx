import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Básico',
    price: 'R$ 0',
    description: 'Para organização pessoal simples.',
    features: [
      'Até 5 usuários',
      '2 módulos ativos',
      '100 tarefas/mês',
      'Matriz de Eisenhower'
    ],
    icon: Zap,
    color: 'text-blue-500',
    current: true
  },
  {
    name: 'Intermediário',
    price: 'R$ 49',
    description: 'Para pequenas equipes e famílias.',
    features: [
      'Até 20 usuários',
      '5 módulos ativos',
      '500 tarefas/mês',
      'Relatórios detalhados',
      'Modo Foco Pomodoro'
    ],
    icon: Shield,
    color: 'text-purple-500',
    popular: true
  },
  {
    name: 'Avançado',
    price: 'R$ 149',
    description: 'Para grandes instituições e empresas.',
    features: [
      'Usuários ilimitados',
      'Módulos ilimitados',
      'Tarefas ilimitadas',
      'Dashboard Inteligente IA',
      'Suporte prioritário 24/7'
    ],
    icon: Crown,
    color: 'text-amber-500'
  }
];

interface PlanSelectorProps {
  onUpgrade?: () => void;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ onUpgrade }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto py-12">
      {PLANS.map((plan) => {
        const Icon = plan.icon;
        
        return (
          <Card key={plan.name} className={cn(
            "relative flex flex-col transition-all duration-300 hover:scale-105",
            plan.popular && "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary"
          )}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">Mais Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4", plan.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 pt-6">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button 
                variant={plan.current ? 'outline' : 'default'} 
                className="w-full h-11 rounded-xl"
                disabled={plan.current}
                onClick={onUpgrade}
              >
                {plan.current ? 'Plano Atual' : 'Fazer Upgrade'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
