import React, { useState } from 'react';
import { Task, EisenhowerQuadrant, QUADRANT_LABELS, User, MODULES, Module } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  initialQuadrant?: EisenhowerQuadrant;
  initialData?: Task;
  users?: User[];
  modules?: Module[];
  onSubmit: (data: any) => void;
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

export const TaskForm: React.FC<TaskFormProps> = ({ initialQuadrant, initialData, users = [], groups = [], onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [quadrant, setQuadrant] = useState<EisenhowerQuadrant>(initialData?.quadrant || initialQuadrant || 'important-not-urgent');
  const [moduleId, setModuleId] = useState<string>(initialData?.moduleId || 'pessoal');
  const [assignedTo, setAssignedTo] = useState<string>(initialData?.assignedTo?.[0] || '');
  const [deadline, setDeadline] = useState(initialData?.deadlineAt ? new Date(initialData.deadlineAt).toISOString().split('T')[0] : '');
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate || '');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>(initialData?.recurringFrequency || 'weekly');

  // New fields for familiar sub-category
  const [familiarSubCategory, setFamiliarSubCategory] = useState<'HOUSE' | 'ROUTINE' | 'EVENT' | 'TASK'>(initialData?.familiarSubCategory || 'HOUSE');

  // New fields for financial intelligence
  const [isFinanceLinked, setIsFinanceLinked] = useState(!!initialData?.financeInfo);
  const [financeType, setFinanceType] = useState<'INCOME' | 'EXPENSE'>(initialData?.financeInfo?.type || 'EXPENSE');
  const [financePillar, setFinancePillar] = useState<'profissional' | 'casa'>(initialData?.financeInfo?.pillar || 'casa');
  const [financeAmount, setFinanceAmount] = useState(initialData?.financeInfo?.amount?.toString() || '');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const keywords = ['pagamento', 'financeiro', 'pago', 'receber', 'custo', 'gasto', 'compra'];
    if (keywords.some(k => val.toLowerCase().includes(k))) {
      setIsFinanceLinked(true);
    }
  };

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
      scheduledDate: scheduledDate || null,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      // Pass the extra data so App.tsx can decide where else to save it
      ...(moduleId === 'familiar' ? { familiarSubCategory } : {}),
      ...(isFinanceLinked ? { financeInfo: { type: financeType, pillar: financePillar, amount: parseFloat(financeAmount) || 0 } } : {})
    } as any);
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
            onChange={(e) => handleTitleChange(e.target.value)}
            autoFocus
            className="h-10"
          />
        </div>

        {isFinanceLinked && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-3 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-green-600 uppercase">Inteligência Financeira</Label>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setIsFinanceLinked(false)}>Ignorar</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Tipo</Label>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant={financeType === 'INCOME' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-[10px]"
                    onClick={() => setFinanceType('INCOME')}
                  >Entrada</Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant={financeType === 'EXPENSE' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-[10px]"
                    onClick={() => setFinanceType('EXPENSE')}
                  >Saída</Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Pilar</Label>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant={financePillar === 'profissional' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-[10px]"
                    onClick={() => setFinancePillar('profissional')}
                  >Profissional</Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant={financePillar === 'casa' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-[10px]"
                    onClick={() => setFinancePillar('casa')}
                  >Da Casa</Button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Valor Sugerido para o Lançamento</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-muted-foreground font-bold">R$</span>
                <Input 
                  type="number" 
                  className="pl-8 h-8 text-sm" 
                  value={financeAmount} 
                  onChange={e => setFinanceAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        )}

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

        <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <Label htmlFor="isRecurring" className="cursor-pointer text-sm font-semibold">Tarefa Recorrente</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-1">
              <Select value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Frequência" />
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

        {moduleId === 'familiar' && (
          <div className="space-y-2 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl animate-in slide-in-from-top-2">
            <Label className="text-xs font-bold text-purple-600 uppercase">Subcategoria Familiar (Vinculado ao Mural)</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'HOUSE', label: 'Casa' },
                { id: 'ROUTINE', label: 'Rotina' },
                { id: 'EVENT', label: 'Evento' },
                { id: 'TASK', label: 'Tarefa' }
              ].map(sub => (
                <Button
                  key={sub.id}
                  type="button"
                  variant={familiarSubCategory === sub.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => setFamiliarSubCategory(sub.id as any)}
                >
                  {sub.label}
                </Button>
              ))}
            </div>
          </div>
        )}

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

        {quadrant === 'important-not-urgent' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label htmlFor="scheduledDate">Data do Agendamento</Label>
            <Input 
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              placeholder="Quando esta tarefa será realizada?"
              className="h-10"
            />
          </div>
        )}

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
