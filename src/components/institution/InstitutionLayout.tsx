import React, { useState } from 'react';
import { InstitutionDashboard } from './Dashboard';
import { InstitutionUsers } from './Users';
import { LayoutDashboard, Users, Ticket, CheckSquare, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const InstitutionLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tasks' | 'tickets' | 'chat'>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Membros', icon: Users },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-4 overflow-x-auto no-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "hover:bg-muted"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'dashboard' && <InstitutionDashboard />}
        {activeTab === 'users' && <InstitutionUsers />}
        {activeTab === 'tasks' && <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">Módulo de Tarefas da Equipe</div>}
        {activeTab === 'tickets' && <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">Módulo de Tickets</div>}
        {activeTab === 'chat' && <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">Chat da Instituição</div>}
      </div>
    </div>
  );
};
