import React, { useState } from 'react';
import { InstitutionDashboard } from './Dashboard';
import { InstitutionUsers } from './Users';
import { LayoutDashboard, Users, Ticket, CheckSquare, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, Institution, Task } from '@/types';
import { InstitutionPanel } from '../InstitutionPanel';
import { Button } from '@/components/ui/button';

interface InstitutionLayoutProps {
  user: User;
  institution?: Institution;
  users: User[];
  projects: any[]; // Or proper Project type
  tasks: Task[];
  onDelegateTask: (userId: string, taskData: any) => void;
  onRefreshInstitution?: () => void;
  isPersonal?: boolean;
}

export const InstitutionLayout: React.FC<InstitutionLayoutProps> = ({ 
  user, 
  institution, 
  users, 
  tasks,
  onDelegateTask,
  isPersonal
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tasks' | 'tickets'>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: isPersonal ? 'Pessoas' : 'Membros', icon: Users },
    { id: 'tasks', label: isPersonal ? 'Delegar a Outros' : 'Delegar Tarefas', icon: CheckSquare },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
  ];

  const isManager = user.role === 'ADMIN' || user.role === 'MANAGER' || isPersonal;

  if (!isManager) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
          <CheckSquare className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic">Área Restrita</h2>
          <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Acesso exclusivo para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2 uppercase italic">
            {isPersonal ? 'Gestão Pessoal' : 'Gestão Institucional'}
          </h2>
          <p className="text-muted-foreground font-medium">
            {isPersonal 
              ? 'Administre as pessoas que você convidou e delegue tarefas pessoais.' 
              : 'Administre sua equipe, delegue funções e monitore o desempenho global.'}
          </p>
        </div>
        {institution && (
          <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-2xl border">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inscritos</p>
              <p className="text-sm font-bold">{users.length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-b pb-4 overflow-x-auto no-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 shadow-xl" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'dashboard' && <InstitutionDashboard users={users} institution={institution} tasks={tasks} />}
        {activeTab === 'users' && <InstitutionUsers users={users} institution={institution} isPersonal={isPersonal} />}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <InstitutionPanel 
              user={user} 
              institution={institution} 
              users={users} 
              onJoin={() => {}} 
              onDelegateTask={onDelegateTask} 
              hideMembers={true}
            />
          </div>
        )}
        {activeTab === 'tickets' && (
          <div className="p-16 text-center space-y-4 border-2 border-dashed rounded-[40px] bg-muted/5">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase tracking-tighter">Ouvidoria & Tickets</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Gerencie solicitações internas e suporte técnico da sua instituição.</p>
            </div>
            <Button variant="outline" className="rounded-full px-8">Ativar Módulo</Button>
          </div>
        )}
      </div>
    </div>
  );
};
