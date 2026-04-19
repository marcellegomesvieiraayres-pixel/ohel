import React, { useState, useEffect } from 'react';
import { Institution, User, Task, EisenhowerQuadrant, OperationType } from '@/types';
import { db, handleFirestoreError } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  UserPlus, 
  Users, 
  Key, 
  Plus,
  ArrowRight,
  ShieldCheck,
  Lock,
  Tag
} from 'lucide-react';

interface MemberTracking {
  userId: string;
  name: string;
  inviteCode: string;
  joinedAt: any;
}

interface InstitutionPanelProps {
  user: User; // Current user
  institution?: Institution;
  users: User[];
  onJoin: (code: string) => void;
  onDelegateTask: (userId: string, taskData: any) => void;
}

export const InstitutionPanel: React.FC<InstitutionPanelProps> = ({ 
  user: currentUser,
  institution, 
  users, 
  onJoin,
  onDelegateTask 
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegateTitle, setDelegateTitle] = useState('');
  const [delegateQuadrant, setDelegateQuadrant] = useState<EisenhowerQuadrant>('important-not-urgent');
  const [memberLog, setMemberLog] = useState<MemberTracking[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  useEffect(() => {
    if (institution?.id && isManager) {
      const q = query(
        collection(db, 'institutions', institution.id, 'members'),
        orderBy('joinedAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMemberLog(snapshot.docs.map(doc => doc.data() as MemberTracking));
      }, (error) => handleFirestoreError(error, OperationType.LIST, `institutions/${institution.id}/members`));
      return () => unsubscribe();
    }
  }, [institution?.id, isManager]);

  const handleDelegate = () => {
    if (!delegateUserId || !delegateTitle) return;
    onDelegateTask(delegateUserId, {
      title: delegateTitle,
      description: 'Tarefa delegada institucionalmente.',
      quadrant: delegateQuadrant,
      deadlineAt: Date.now() + 24 * 60 * 60 * 1000 // Default 24h deadline for delegated tasks
    });
    setDelegateTitle('');
  };

  if (!isManager && institution) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black">Acesso Restrito</h2>
          <p className="text-muted-foreground">Esta área é exclusiva para o Gestor e Administradores da instituição.</p>
        </div>
        <Card className="p-8 border-2 border-dashed">
          <p className="text-sm text-muted-foreground">
            Sua participação na instituição <strong>{institution.name}</strong> está ativa, mas você não possui permissões administrativas para gerenciar membros ou delegar tarefas globais.
          </p>
        </Card>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            <CardTitle>Entrar em uma Instituição</CardTitle>
            <CardDescription>
              Insira o código de convite para colaborar com sua equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Convite</Label>
              <Input 
                id="code" 
                placeholder="EX: OHEL-2026" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => onJoin(inviteCode)}>
              Validar Código
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{institution.name}</CardTitle>
                <CardDescription>Gestão institucional e delegação de tarefas.</CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                Plano {institution.planType}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Código de Convite Ativo</p>
                <p className="text-lg font-mono font-bold">{institution.inviteCode || 'NENHUM'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(institution.inviteCode);
                  toast.success('Código copiado!');
                }}>Copiar</Button>
                {isManager && (
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "text-destructive hover:bg-destructive/10 transition-all font-bold text-[10px] uppercase tracking-tighter",
                        showConfirmReset && "bg-destructive text-white hover:bg-destructive/90"
                      )}
                      onClick={() => {
                        if (showConfirmReset) {
                          updateDoc(doc(db, 'institutions', institution.id), { inviteCode: '' });
                          toast.success('Código removido!');
                          setShowConfirmReset(false);
                        } else {
                          setShowConfirmReset(true);
                        }
                      }}
                    >
                      {showConfirmReset ? 'Confirmar Exclusão?' : 'Remover Código'}
                    </Button>
                    {showConfirmReset && (
                      <Button variant="outline" size="sm" className="h-6 text-[8px]" onClick={() => setShowConfirmReset(false)}>Cancelar</Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {memberLog.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Log de Convites Usados
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {memberLog.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-[10px] border">
                      <span className="font-bold">{log.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-mono">{log.inviteCode}</Badge>
                        <span className="text-muted-foreground">{new Date(log.joinedAt?.toDate?.() || log.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed gap-2">
              <UserPlus className="w-4 h-4" />
              Convidar Membro
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delegar Tarefa Institucional</CardTitle>
          <CardDescription>Atribua responsabilidades diretamente aos membros da sua equipe.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Membro</Label>
              <select 
                className="w-full h-10 px-3 bg-background border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={delegateUserId}
                onChange={(e) => setDelegateUserId(e.target.value)}
              >
                <option value="">Selecionar membro...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Título da Tarefa</Label>
              <Input 
                placeholder="Ex: Relatório Trimestral" 
                value={delegateTitle}
                onChange={(e) => setDelegateTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quadrante</Label>
              <select 
                className="w-full h-10 px-3 bg-background border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={delegateQuadrant}
                onChange={(e) => setDelegateQuadrant(e.target.value as EisenhowerQuadrant)}
              >
                <option value="urgent-important">Urgente e Importante</option>
                <option value="important-not-urgent">Importante, Não Urgente</option>
                <option value="urgent-not-important">Urgente, Não Importante</option>
                <option value="not-urgent-not-important">Nem Urgente, Nem Importante</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" onClick={handleDelegate}>
                <ShieldCheck className="w-4 h-4" />
                Delegar Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
