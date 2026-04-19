import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, serverTimestamp, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User, FinancialTransaction, TeamTask, EisenhowerQuadrant, UserGroup } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, 
  DollarSign, 
  Users, 
  Ticket, 
  MessageSquare, 
  Plus,
  X,
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfessionalModuleProps {
  userId: string;
  institutionId?: string;
  defaultTab?: string;
}

export const ProfessionalModule: React.FC<ProfessionalModuleProps> = ({ userId, institutionId, defaultTab = 'finance' }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Finance State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'FIXED' | 'INVESTMENT'>('INCOME');

  // Groups State
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (!userId) return;
    const unsubTransactions = fetchTransactions();
    let unsubTeamUsers: any;
    let unsubTeamTasks: any;
    let unsubGroups: any;

    if (institutionId) {
      unsubTeamUsers = fetchTeamUsers();
      unsubGroups = fetchGroups();
    }

    return () => {
      unsubTransactions?.();
      unsubTeamUsers?.();
      unsubGroups?.();
    };
  }, [userId, institutionId]);

  const fetchTransactions = () => {
    const q = query(
      collection(db, 'professional_finance'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialTransaction)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'professional_finance'));
  };

  const fetchTeamUsers = () => {
    const q = query(collection(db, 'users'), where('institutionId', '==', institutionId));
    return onSnapshot(q, (snap) => {
      setTeamUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
  };

  const fetchGroups = () => {
    const q = query(collection(db, 'groups'), where('institutionId', '==', institutionId));
    return onSnapshot(q, (snap) => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserGroup)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'groups'));
  };

  const handleRemoveMemberFromGroup = async (groupId: string, memberId: string) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayRemove(memberId)
      });
      toast.success('Membro removido do grupo!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName) {
      toast.error('Informe o nome do grupo');
      return;
    }
    if (!institutionId) {
      toast.error('Você precisa estar em uma instituição para criar grupos');
      return;
    }
    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        institutionId,
        members: [],
        createdAt: serverTimestamp()
      });
      setNewGroupName('');
      toast.success('Grupo criado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'groups');
    }
  };

  const handleAddMemberToGroup = async (groupId: string, memberId: string) => {
    if (!memberId || memberId === 'none' || memberId === '') return;
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion(memberId)
      });
      toast.success('Membro adicionado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !description) return;
    try {
      await addDoc(collection(db, 'professional_finance'), {
        userId,
        amount: parseFloat(amount),
        description,
        type,
        date: serverTimestamp()
      });
      setAmount('');
      setDescription('');
      toast.success('Transação registrada!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'professional_finance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Módulo Profissional</h2>
          <p className="text-muted-foreground">Gestão financeira, equipe e produtividade corporativa.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="finance" className="rounded-lg gap-2">
            <DollarSign className="w-4 h-4" /> Controle Financeiro
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg gap-2">
            <Users className="w-4 h-4" /> Equipe & Usuários
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-lg gap-2">
            <MessageSquare className="w-4 h-4" /> Chat da Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="p-4">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Equipe Online
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{teamUsers.filter(u => u.status === 'online').length}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="p-4">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  Entradas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-green-500">
                  R$ {transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader className="p-4">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  Saídas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-red-500">
                  R$ {transactions.filter(t => t.type !== 'INCOME').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Novo Lançamento</CardTitle>
                <CardDescription>Registre entradas e saídas profissionais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Pagamento Projeto X" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'INCOME', label: 'Entrada' },
                      { id: 'EXPENSE', label: 'Saída' },
                      { id: 'FIXED', label: 'Fixo' },
                      { id: 'INVESTMENT', label: 'Investimento' }
                    ].map(t => (
                      <Button 
                        key={t.id} 
                        variant={type === t.id ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setType(t.id as any)}
                        className="text-[10px]"
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddTransaction}>Registrar</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Histórico de movimentações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 border rounded-2xl bg-muted/10">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          t.type === 'INCOME' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold">{t.description}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {t.type === 'INCOME' ? 'Entrada' : 
                             t.type === 'EXPENSE' ? 'Saída' : 
                             t.type === 'FIXED' ? 'Fixo' : 'Investimento'}
                          </Badge>
                        </div>
                      </div>
                      <div className={cn("text-lg font-bold", t.type === 'INCOME' ? "text-green-500" : "text-red-500")}>
                        {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Criar Novo Grupo</CardTitle>
                <CardDescription>Ex: Administrativo, Comercial, RH</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Grupo</Label>
                  <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Nome do grupo..." />
                </div>
                <Button className="w-full" onClick={handleCreateGroup}>
                  <Plus className="w-4 h-4 mr-2" /> Criar Grupo
                </Button>
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grupos e Departamentos</CardTitle>
                  <CardDescription>Gerencie membros e permissões por setor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groups.map(group => (
                    <div key={group.id} className="border rounded-2xl p-4 bg-muted/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          <h4 className="font-bold text-lg">{group.name}</h4>
                          <Badge variant="secondary">{group.members.length} membros</Badge>
                        </div>
                        <Select onValueChange={(memberId: string) => handleAddMemberToGroup(group.id, memberId)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Adicionar membro" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamUsers.filter(u => !group.members.includes(u.id)).map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(group.members || [])).filter(m => m && m !== 'none' && m !== '').map((memberId: string) => {
                          const user = teamUsers.find(u => u.id === memberId);
                          if (!user) return null; // Don't show "Membro" if user data not found yet or ID is invalid
                          return (
                            <Badge key={memberId} variant="outline" className="pl-1 pr-1 py-1 gap-2 bg-background group/member relative hover:border-destructive/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                  {user.name.charAt(0)}
                                </div>
                                <span className="max-w-[80px] truncate">{user.name}</span>
                              </div>
                              <button 
                                onClick={() => handleRemoveMemberFromGroup(group.id, memberId)}
                                className="hover:bg-destructive/10 text-destructive rounded-sm p-0.5 transition-colors"
                                title="Remover do grupo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {groups.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum grupo criado ainda.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usuários da Instituição</CardTitle>
                  <CardDescription>Membros cadastrados e status em tempo real</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamUsers.map(u => (
                      <div key={u.id} className="p-4 border rounded-2xl flex items-center gap-4 bg-muted/10">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" /> : u.name.charAt(0)}
                          </div>
                          <div className={cn(
                            "absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-card",
                            u.status === 'online' ? "bg-green-500" : "bg-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.role}</p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card className="h-[600px] flex flex-col overflow-hidden">
            <div className="flex h-full">
              {/* Sidebar Members */}
              <div className="w-64 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b font-bold text-sm uppercase tracking-wider">Membros</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {teamUsers.map(u => (
                    <button 
                      key={u.id} 
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left group"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0)}
                        </div>
                        <div className={cn(
                          "absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                          u.status === 'online' ? "bg-green-500" : "bg-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.status || 'offline'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-lg">Canal Geral</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                      <MessageSquare className="w-12 h-12 mb-2" />
                      <p>Inicie uma conversa com a equipe.</p>
                    </div>
                  </div>
                  <div className="p-4 border-t bg-muted/20">
                    <div className="flex gap-2">
                      <Input placeholder="Digite sua mensagem..." className="flex-1" />
                      <Button size="icon"><ArrowUpRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
