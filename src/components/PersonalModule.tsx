import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { FamilyEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Home, Calendar, ClipboardList, Heart, Plus, Trash2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PersonalModuleProps {
  userId: string;
}

export const PersonalModule: React.FC<PersonalModuleProps> = ({ userId }) => {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'HOUSE' | 'ROUTINE' | 'EVENT' | 'TASK'>('HOUSE');
  const [activeTab, setActiveTab] = useState('familiar');

  // Finance state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'personal_family'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const unsubEvents = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyEvent)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'personal_family'));

    const fq = query(
      collection(db, 'personal_finance'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const unsubFinance = onSnapshot(fq, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'personal_finance'));

    return () => {
      unsubEvents();
      unsubFinance();
    };
  }, [userId]);

  const handleAddEvent = async () => {
    if (!title) return;
    try {
      await addDoc(collection(db, 'personal_family'), {
        userId,
        title,
        category,
        date: serverTimestamp()
      });
      setTitle('');
      toast.success('Item adicionado à organização familiar!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'personal_family');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'personal_family', id));
      toast.success('Item removido!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `personal_family/${id}`);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !desc) return;
    try {
      await addDoc(collection(db, 'personal_finance'), {
        userId,
        amount: parseFloat(amount),
        description: desc,
        type,
        date: serverTimestamp()
      });
      setAmount('');
      setDesc('');
      toast.success('Lançamento financeiro realizado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'personal_finance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
          <Home className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organização Familiar</h2>
          <p className="text-muted-foreground">Harmonia, ordem e finanças para o seu lar e família.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="familiar" className="rounded-lg gap-2">
            <Home className="w-4 h-4" /> Mural & Rotina
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2">
            <DollarSign className="w-4 h-4" /> Finanças da Casa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="familiar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-purple-500/20 bg-purple-500/5">
              <CardHeader>
                <CardTitle>Adicionar Item</CardTitle>
                <CardDescription>Organize tarefas domésticas ou eventos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>O que organizar?</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Limpeza da cozinha" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'HOUSE', label: 'Casa', icon: <Home className="w-3 h-3" /> },
                      { id: 'ROUTINE', label: 'Rotina', icon: <ClipboardList className="w-3 h-3" /> },
                      { id: 'EVENT', label: 'Evento', icon: <Calendar className="w-3 h-3" /> },
                      { id: 'TASK', label: 'Tarefa', icon: <Heart className="w-3 h-3" /> },
                    ].map(cat => (
                      <Button 
                        key={cat.id} 
                        variant={category === cat.id ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setCategory(cat.id as any)}
                        className="gap-2 text-[10px]"
                      >
                        {cat.icon}
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleAddEvent}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Mural da Família</CardTitle>
                <CardDescription>Tudo o que está acontecendo no lar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(event => (
                    <div key={event.id} className="p-4 border rounded-2xl bg-muted/5 hover:bg-muted/10 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                          {event.category === 'HOUSE' ? 'Casa' : 
                           event.category === 'ROUTINE' ? 'Rotina' : 
                           event.category === 'EVENT' ? 'Evento' : 'Tarefa'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {event.date?.seconds ? new Date(event.date.seconds * 1000).toLocaleDateString() : 'Agora'}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg">{event.title}</h4>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => handleDeleteEvent(event.id)}
                          title="Remover Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="col-span-2 py-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                      Nenhum item registrado na organização familiar.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle>Lançamento Familiar</CardTitle>
                <CardDescription>Controle os gastos e ganhos da casa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Supermercado" />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={type === 'INCOME' ? 'default' : 'outline'} 
                    className="flex-1"
                    onClick={() => setType('INCOME')}
                  >
                    Entrada
                  </Button>
                  <Button 
                    variant={type === 'EXPENSE' ? 'default' : 'outline'} 
                    className="flex-1"
                    onClick={() => setType('EXPENSE')}
                  >
                    Saída
                  </Button>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleAddTransaction}>
                  Lançar
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Extrato da Casa</CardTitle>
                <CardDescription>Histórico de movimentações financeiras familiares</CardDescription>
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
                          <p className="text-[10px] text-muted-foreground">
                            {t.date?.seconds ? new Date(t.date.seconds * 1000).toLocaleDateString() : 'Agora'}
                          </p>
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
      </Tabs>
    </div>
  );
};
