import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { FitnessHabit, WellBeingLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Dumbbell, 
  Droplets, 
  Zap, 
  Smile, 
  Plus, 
  Minus,
  TrendingUp,
  Activity,
  Utensils,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FitnessModuleProps {
  userId: string;
}

export const FitnessModule: React.FC<FitnessModuleProps> = ({ userId }) => {
  const [habits, setHabits] = useState<FitnessHabit[]>([]);
  const [wellBeing, setWellBeing] = useState<WellBeingLog | null>(null);
  const [activeTab, setActiveTab] = useState('habits');
  const today = format(new Date(), 'yyyy-MM-dd');

  // Menu state
  const [menu, setMenu] = useState<any[]>([]);
  const [foodSearch, setFoodSearch] = useState('');

  useEffect(() => {
    if (!userId) return;
    
    const habitsQuery = query(
      collection(db, 'fitness_habits'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    
    const wellBeingQuery = query(
      collection(db, 'wellbeing_logs'),
      where('userId', '==', userId),
      where('date', '==', today)
    );

    const unsubHabits = onSnapshot(habitsQuery, (snap) => {
      setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() } as FitnessHabit)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'fitness_habits'));

    const unsubWellBeing = onSnapshot(wellBeingQuery, (snap) => {
      if (!snap.empty) {
        setWellBeing({ id: snap.docs[0].id, ...snap.docs[0].data() } as WellBeingLog);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'wellbeing_logs'));

    return () => {
      unsubHabits();
      unsubWellBeing();
    };
  }, [userId, today]);

  const updateHabit = async (habit: FitnessHabit, delta: number) => {
    try {
      const newVal = Math.max(0, habit.current + delta);
      await setDoc(doc(db, 'fitness_habits', habit.id), {
        current: newVal
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fitness_habits/${habit.id}`);
    }
  };

  const logWellBeing = async (field: 'mood' | 'energy', value: number) => {
    try {
      const logData = {
        userId,
        date: today,
        mood: wellBeing?.mood || 3,
        energy: wellBeing?.energy || 3,
        [field]: value,
        updatedAt: serverTimestamp()
      };
      
      if (wellBeing) {
        await setDoc(doc(db, 'wellbeing_logs', wellBeing.id), logData, { merge: true });
      } else {
        await addDoc(collection(db, 'wellbeing_logs'), logData);
      }
      toast.success('Estado de bem-estar atualizado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'wellbeing_logs');
    }
  };

  const waterHabit = habits.find(h => h.type === 'WATER');
  const exerciseHabit = habits.find(h => h.type === 'EXERCISE');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pilar Pessoal</h2>
          <p className="text-muted-foreground">Hábitos, saúde, alimentação e treinos para sua melhor versão.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="habits" className="rounded-lg gap-2">
            <Zap className="w-4 h-4" /> Hábitos & Saúde
          </TabsTrigger>
          <TabsTrigger value="menu" className="rounded-lg gap-2">
            <Utensils className="w-4 h-4" /> Cardápio & Calorias
          </TabsTrigger>
          <TabsTrigger value="fitness" className="rounded-lg gap-2">
            <Dumbbell className="w-4 h-4" /> Área Fitness
          </TabsTrigger>
        </TabsList>

        <TabsContent value="habits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Water Control */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  Controle de Água
                </CardTitle>
                <CardDescription>Meta diária: 2.5L</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-5xl font-bold text-blue-500">
                    {((waterHabit?.current || 0) / 1000).toFixed(1)}
                  </span>
                  <span className="text-xl text-muted-foreground ml-2">L</span>
                </div>
                <Progress value={((waterHabit?.current || 0) / 2500) * 100} className="h-3 bg-blue-500/10" />
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => waterHabit && updateHabit(waterHabit, -250)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button variant="default" className="bg-blue-500 hover:bg-blue-600" onClick={() => waterHabit && updateHabit(waterHabit, 250)}>
                    <Plus className="w-4 h-4 mr-2" /> 250ml
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Well-being Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-amber-500" />
                  Estado de Espírito
                </CardTitle>
                <CardDescription>Como você se sente hoje?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest opacity-70">Humor</Label>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button 
                        key={v}
                        onClick={() => logWellBeing('mood', v)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          wellBeing?.mood === v ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest opacity-70">Energia</Label>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button 
                        key={v}
                        onClick={() => logWellBeing('energy', v)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          wellBeing?.energy === v ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Steps & Habits */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Metas Diárias
                </CardTitle>
                <CardDescription>Pequenas vitórias, grandes resultados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-card border rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-bold text-sm">Passos</p>
                      <p className="text-xs text-muted-foreground">Meta: 10.000</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">6.432</span>
                </div>
                <div className="p-4 bg-card border rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-bold text-sm">Leitura</p>
                      <p className="text-xs text-muted-foreground">Meta: 15 min</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Concluir</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Contador de Calorias</CardTitle>
                <CardDescription>Busque alimentos e registre seu consumo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ex: Arroz integral..." 
                    value={foodSearch}
                    onChange={e => setFoodSearch(e.target.value)}
                  />
                  <Button size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Consumido</span>
                    </div>
                    <span className="font-bold">1.240 kcal</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Meta Diária</span>
                    </div>
                    <span className="font-bold">2.000 kcal</span>
                  </div>
                  <Progress value={(1240/2000)*100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Cardápio Semanal</CardTitle>
                <CardDescription>Planeje suas refeições para a semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                    <div key={day} className="p-4 border rounded-2xl bg-muted/5">
                      <h4 className="font-bold text-sm mb-2 text-primary">{day}</h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Almoço: Frango com batata doce</p>
                        <p>Jantar: Salada completa</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fitness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Treino Semanal</CardTitle>
              <CardDescription>Sua rotina de exercícios planejada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border rounded-3xl bg-primary/5 border-primary/20">
                  <Dumbbell className="w-8 h-8 text-primary mb-4" />
                  <h4 className="font-bold text-lg mb-2">Treino A</h4>
                  <p className="text-sm text-muted-foreground mb-4">Foco: Membros Superiores</p>
                  <ul className="text-xs space-y-2 mb-6">
                    <li>• Supino Reto - 4x12</li>
                    <li>• Remada Curvada - 4x12</li>
                    <li>• Desenvolvimento - 3x15</li>
                  </ul>
                  <Button className="w-full">Iniciar Treino</Button>
                </div>
                <div className="p-6 border rounded-3xl bg-muted/5">
                  <Dumbbell className="w-8 h-8 text-muted-foreground mb-4" />
                  <h4 className="font-bold text-lg mb-2">Treino B</h4>
                  <p className="text-sm text-muted-foreground mb-4">Foco: Membros Inferiores</p>
                  <ul className="text-xs space-y-2 mb-6">
                    <li>• Agachamento - 4x12</li>
                    <li>• Leg Press - 4x15</li>
                    <li>• Extensora - 3x20</li>
                  </ul>
                  <Button variant="outline" className="w-full">Iniciar Treino</Button>
                </div>
                <div className="p-6 border rounded-3xl bg-muted/5">
                  <Activity className="w-8 h-8 text-muted-foreground mb-4" />
                  <h4 className="font-bold text-lg mb-2">Cardio</h4>
                  <p className="text-sm text-muted-foreground mb-4">Foco: Resistência</p>
                  <ul className="text-xs space-y-2 mb-6">
                    <li>• Corrida - 30 min</li>
                    <li>• Pular Corda - 10 min</li>
                  </ul>
                  <Button variant="outline" className="w-full">Iniciar Treino</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
