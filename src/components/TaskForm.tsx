import React, { useState } from 'react';
import { EisenhowerQuadrant, QUADRANT_LABELS, User, MODULES, Module } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  initialQuadrant?: EisenhowerQuadrant;
  users?: User[];
  modules?: Module[];
  onSubmit: (data: { 
    title: string; 
    description: string; 
    quadrant: EisenhowerQuadrant; 
    moduleId: string;
    assignedTo?: string[];
    assignedToGroups?: string[];
    deadlineAt?: number | null;
    isRecurring?: boolean;
    recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  }) => void;
  onCancel: () => void;
  groups?: { id: string, name: string }[];
}

const CATEGORIES = [
  { id: 'pessoal', name: 'Pessoal' },
  { id: 'familiar', name: 'Familiar' },
  { id: 'profissional', name: 'Profissional' },
  { id: 'espiritual', name: 'Espiritual' },
];

const PRIORITIES = [
  { id: 'urgent-important', label: 'FAZER AGORA', color: 'text-red-500' },
  { id: 'important-not-urgent', label: 'AGENDAR', color: 'text-blue-500' },
  { id: 'urgent-not-important', label: 'DELEGAR', color: 'text-orange-500' },
];

export const TaskForm: React.FC<TaskFormProps> = ({ initialQuadrant, users = [], groups = [], onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quadrant, setQuadrant] = useState<EisenhowerQuadrant>(initialQuadrant || 'important-not-urgent');
  const [moduleId, setModuleId] = useState<string>('pessoal');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [deadline, setDeadline] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const isDelegating = quadrant === 'urgent-not-important';
    const isGroup = assignedTo.startsWith('group:');
    const targetId = isGroup ? assignedTo.replace('group:', '') : assignedTo;

    onSubmit({ 
      title, 
      description, 
      quadrant,
      moduleId,
      assignedTo: (isDelegating && !isGroup && targetId !== '') ? [targetId] : undefined,
      assignedToGroups: (isDelegating && isGroup) ? [targetId] : undefined,
      deadlineAt: deadline ? new Date(deadline).getTime() : null,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Nova Tarefa</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 gap-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">O que você vai realizar?</Label>
          <Input
            id="title"
            placeholder="Título da tarefa..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (Detalhes importantes)</Label>
          <Input
            id="description"
            placeholder="Alguma observação adicional?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria / Pilar</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo final</Label>
            <Input 
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map(p => (
              <Button
                key={p.id}
                type="button"
                variant={quadrant === p.id ? 'default' : 'outline'}
                className={cn(
                  "h-12 text-[10px] font-black tracking-widest",
                  quadrant === p.id && "shadow-lg scale-105"
                )}
                onClick={() => setQuadrant(p.id as any)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {quadrant === 'urgent-not-important' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="delegate">Delegar para:</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Selecione</SelectItem>
                <optgroup label="Usuários">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </optgroup>
                {groups.length > 0 && (
                  <optgroup label="Grupos">
                    {groups.map(g => (
                      <SelectItem key={g.id} value={`group:${g.id}`}>{g.name}</SelectItem>
                    ))}
                  </optgroup>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <Label htmlFor="isRecurring" className="cursor-pointer text-sm font-medium">Tarefa Recorrente</Label>
        </div>

        {isRecurring && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as any)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DialogFooter className="mt-6 gap-2 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!title.trim() || (quadrant === 'urgent-not-important' && assignedTo === '')} className="px-8 font-black tracking-widest uppercase">
          {initialQuadrant ? 'Salvar' : 'Criar Tarefa'}
        </Button>
      </DialogFooter>
    </form>
  );
};
