import React, { useState } from 'react';
import { Task, User, EisenhowerQuadrant, QUADRANT_LABELS, Institution } from '@/types';
import { motion } from 'motion/react';
import { 
  CheckSquare, 
  Calendar, 
  Users, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  MessageSquare,
  UserPlus,
  QrCode,
  TrendingUp,
  CalendarDays,
  CreditCard,
  Plus,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onTaskClick: (task: Task) => void;
  onUserClick: (user: User) => void;
  onAddAppointment: () => void;
  onUpdateJourney?: (days: number) => void;
  onRegenerateInviteCode?: () => void;
  institution?: Institution;
  subscription?: any;
  onNavigate?: (view: any) => void;
  onToggleFocus?: () => void;
  onCompleteTask?: (taskId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  users, 
  currentUser,
  onTaskClick, 
  onUserClick, 
  onAddAppointment,
  onUpdateJourney,
  onRegenerateInviteCode,
  institution,
  subscription,
  onNavigate,
  onToggleFocus,
  onCompleteTask
}) => {
  const [isEditingJourney, setIsEditingJourney] = useState(false);
  const [journeyInput, setJourneyInput] = useState(currentUser?.journeyTotalDays?.toString() || '40');

  const todayTasks = tasks.filter(t => {
    if (t.completed) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const taskDate = t.dueDate ? new Date(t.dueDate).setHours(0, 0, 0, 0) : today;
    return taskDate === today;
  });

  const urgentImportantTasks = todayTasks.filter(t => t.quadrant === 'urgent-important');

  const unexecutedPriorities = todayTasks.filter(t => t.quadrant === 'urgent-important');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const journeyDay = currentUser?.journeyStart 
    ? Math.floor((Date.now() - currentUser.journeyStart) / (1000 * 60 * 60 * 24)) + 1 
    : 1;

  return (
    <div className="space-y-6">
      {subscription?.status === 'BLOCKED' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-destructive">Sua conta está bloqueada</p>
              <p className="text-sm text-destructive/80">Regularize sua situação para continuar acessando todos os recursos.</p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            className="w-full md:w-auto gap-2 shadow-lg shadow-destructive/20"
            onClick={() => onNavigate?.('plans')}
          >
            <CreditCard className="w-4 h-4" />
            Ir para Pagamentos
          </Button>
        </motion.div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Usuário'}
          </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Foco Ativo
              </Badge>
              
              <div 
                className="flex items-center gap-2.5 px-3 py-1.5 bg-primary/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-all group shadow-sm"
                onClick={onRegenerateInviteCode}
                title="Clique para gerar novo código"
              >
                <div className="p-1 bg-white rounded-md shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <QRCodeSVG 
                    value={institution?.inviteCode ? `https://app.ohel.com/invite/${institution.inviteCode}` : `https://app.ohel.com/invite/${currentUser?.institutionId || currentUser?.id}`} 
                    size={20}
                    fgColor="#0ea5e9"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px]">Convidar Membros</span>
                  <span className="text-[14px] font-black tracking-widest mt-0.5">
                    {institution?.inviteCode || '...'}
                  </span>
                </div>
              </div>
            </div>
        </div>

        <div className="flex items-center gap-6">
          <div 
            className="text-right cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsEditingJourney(true)}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Jornada Atual</p>
            <div className="flex items-center gap-2 justify-end">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-2xl font-black text-primary">
                {journeyDay}/{currentUser?.journeyTotalDays || 40} dias
              </span>
            </div>
          </div>

          {unexecutedPriorities.length > 0 && (
            <div className="px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-xl animate-pulse">
              <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-0.5">Pendências Críticas</p>
              <p className="text-lg font-black text-destructive">{unexecutedPriorities.length} Prioridades</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: Agenda */}
        <div className="lg:col-span-8">
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight">Agenda do Dia</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onAddAppointment} className="text-xs font-bold uppercase tracking-widest text-primary gap-2">
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                {/* Timeline Items - Dinâmicos */}
                {todayTasks.length > 0 ? (
                  todayTasks.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0)).map((task) => (
                    <div key={task.id} className="relative group cursor-pointer" onClick={() => onTaskClick(task)}>
                      <div className={cn(
                        "absolute -left-8 top-1 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                        task.quadrant === 'urgent-important' ? "border-red-500" : "border-primary"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          task.quadrant === 'urgent-important' ? "bg-red-500 animate-pulse" : "bg-primary"
                        )} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            task.quadrant === 'urgent-important' ? "text-red-500" : "text-primary"
                          )}>
                            {task.dueDate ? format(new Date(task.dueDate), 'HH:mm') : '--:--'}
                          </span>
                          {task.quadrant === 'urgent-important' && (
                            <Badge variant="destructive" className="text-[8px] h-4 py-0 uppercase px-1">Urgente</Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{task.title}</h3>
                        {task.description && <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div 
                    onClick={onAddAppointment}
                    className="p-12 border-2 border-dashed border-border/30 rounded-3xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-primary transition-all cursor-pointer group"
                  >
                    <Clock className="w-10 h-10 mb-4 opacity-10 group-hover:opacity-100 transition-opacity" />
                    <p className="text-sm font-bold uppercase tracking-widest">Nada agendado para hoje</p>
                    <p className="text-xs opacity-50 mt-1">Clique para planejar seu dia</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Priorities & Users */}
        <div className="lg:col-span-4 space-y-6">
          {/* Prioridades Rápidas */}
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Foco Imediato</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleFocus}
                className="h-7 px-2 text-[10px] font-black uppercase tracking-tighter gap-1.5 hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Zap className="w-3 h-3 fill-current" />
                Foco Total
              </Button>
            </div>
            <div className="space-y-3">
              {urgentImportantTasks.slice(0, 3).map(task => (
                <div 
                  key={task.id} 
                  className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3 hover:bg-red-500/10 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => onTaskClick(task)}>
                    <span className="text-xs font-black uppercase tracking-tight truncate pr-2">{task.title}</span>
                    <ArrowUpRight className="w-3 h-3 text-red-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full text-[10px] font-black uppercase tracking-widest h-8 rounded-xl shadow-lg shadow-red-500/10 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompleteTask?.(task.id);
                    }}
                  >
                    <CheckSquare className="w-3 h-3" />
                    Missão Realizada
                  </Button>
                </div>
              ))}
              {urgentImportantTasks.length === 0 && (
                <div className="p-4 text-center border border-dashed rounded-xl">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Sem urgências</p>
                </div>
              )}
            </div>
          </div>

          {/* Membros Ativos */}
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Equipe</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500">{users.filter(u => u.status === 'online').length}</span>
              </div>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {users.map(member => (
                <div 
                  key={member.id}
                  onClick={() => onUserClick(member)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black border border-primary/20">
                      {member.photoURL ? <img src={member.photoURL} className="w-full h-full object-cover rounded-full" /> : member.name.charAt(0)}
                    </div>
                    <div className={cn(
                      "absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                      statusColors[member.status || 'away']
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{member.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">{member.status || 'offline'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* JOURNEY EDIT DIALOG */}
      <Dialog open={isEditingJourney} onOpenChange={setIsEditingJourney}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personalizar Jornada</DialogTitle>
            <DialogDescription>Defina o total de dias para sua jornada atual.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Total de Dias</label>
            <input 
              type="number" 
              value={journeyInput} 
              onChange={(e) => setJourneyInput(e.target.value)}
              className="w-full p-2 bg-muted rounded-lg border focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditingJourney(false)}>Cancelar</Button>
            <Button onClick={() => {
              onUpdateJourney?.(parseInt(journeyInput));
              setIsEditingJourney(false);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
