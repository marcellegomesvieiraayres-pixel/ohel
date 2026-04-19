import React, { useState, useEffect, useRef } from 'react';
import { Task, EisenhowerQuadrant, Module, Institution, User, MODULES, PLAN_LIMITS, PlanType, Mission, Ranking, LogisticsAddress, Message } from '@/types';
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetails } from '@/components/TaskDetails';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { ModuleManagement } from '@/components/ModuleManagement';
import { InstitutionPanel } from '@/components/InstitutionPanel';
import { PlanSelector } from '@/components/PlanSelector';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  TooltipProvider,
  Tooltip as TooltipUI,
  TooltipTrigger,
  TooltipContent,
  Toaster,
  toast,
  Button,
  Badge,
  Card
} from '@/components/ui';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Bell, 
  User as UserIcon,
  Timer,
  Layers,
  Building2,
  CreditCard,
  Menu,
  X,
  AlertTriangle,
  Zap,
  Moon,
  Sun,
  Trophy,
  MapPin,
  MessageSquare,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
  limit,
  or
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthSelector } from '@/components/AuthSelector';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { SpiritualModule } from '@/components/SpiritualModule';
import { NotificationBell } from '@/components/NotificationBell';
import { NotificationsPage } from '@/components/NotificationsPage';
import { Heart } from 'lucide-react';

import { Dashboard } from '@/components/Dashboard';
import { MissionsView } from '@/components/MissionsView';
import { LogisticsView } from '@/components/LogisticsView';
import { MessagesView } from '@/components/MessagesView';

import { OrdemNoCaos } from '@/components/OrdemNoCaos';
import { ProfessionalModule } from '@/components/ProfessionalModule';
import { PersonalModule } from '@/components/PersonalModule';
import { FitnessModule } from '@/components/FitnessModule';
import { LibraryModule } from '@/components/LibraryModule';
import { CalendarView } from '@/components/CalendarView';
import { ProfilePage } from '@/components/ProfilePage';
import { BookOpen, Home, Activity, Briefcase, Calendar as CalendarIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';

import { InstitutionLayout } from '@/components/institution/InstitutionLayout';

const INITIAL_TASKS: Task[] = [];

type View = 'dashboard' | 'matrix' | 'stats' | 'modules' | 'institution' | 'plans' | 'finance' | 'spiritual' | 'notifications' | 'ordem-no-caos' | 'familiar' | 'profissional' | 'biblioteca' | 'fitness' | 'calendar' | 'missions' | 'logistics' | 'messages' | 'profile';

export default function App() {
  const { user, userData: authUserData, loading: authLoading, logout, profileType, setProfileType } = useAuth();
  const { theme, setTheme } = useTheme();

  // Sync Firestore theme preference with ThemeProvider
  useEffect(() => {
    if (authUserData?.themePreference && authUserData.themePreference !== theme) {
      setTheme(authUserData.themePreference as any);
    }
  }, [authUserData?.themePreference, theme, setTheme]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [lastRankPosition, setLastRankPosition] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>(MODULES);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<EisenhowerQuadrant | undefined>();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoURL, setLogoURL] = useState(localStorage.getItem('ohel_custom_logo') || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: dataUrl
        });
        toast.success('Foto de perfil atualizada!');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    };
    reader.readAsDataURL(file);
  };
  const [professionalDefaultTab, setProfessionalDefaultTab] = useState('finance');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('isSidebarCollapsed') === 'true';
  });
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [institution, setInstitution] = useState<Institution | undefined>();
  const [subscription, setSubscription] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const currentPlan = (subscription?.planType as PlanType) || 'BASIC';
  const limits = PLAN_LIMITS[currentPlan];
  const isLimitReached = tasks.length >= limits.tasks;

  // Firestore Real-time Sync
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) return;

    const qMessages = query(
      collection(db, 'messages'), 
      or(where('senderId', '==', user.uid), where('receiverId', '==', user.uid)),
      orderBy('createdAt', 'asc')
    );
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => {
      unsubMessages();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const qRankings = query(collection(db, 'rankings'), orderBy('points', 'desc'), limit(10));
    const unsub = onSnapshot(qRankings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ranking));
      setRankings(data);
      
      const myPos = data.findIndex(r => r.userId === user.uid) + 1;
      
      // If we have a position and it's different from the last one
      if (myPos > 0 && lastRankPosition !== null && myPos !== lastRankPosition) {
        const movedUp = myPos < lastRankPosition;
        addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          type: 'RANKING_CHANGE',
          title: movedUp ? 'Subiu no Ranking! 🚀' : 'Alteração no Ranking',
          message: movedUp 
            ? `Parabéns! Você subiu para a ${myPos}ª posição no ranking.`
            : `Sua posição no ranking mudou para ${myPos}ª. Continue focado!`,
          read: false,
          createdAt: serverTimestamp(),
        }).catch(e => console.error('Error creating ranking notification:', e));
      }
      
      if (myPos > 0) {
        setLastRankPosition(myPos);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'rankings'));
    return () => unsub();
  }, [user, lastRankPosition]);

  useEffect(() => {
    if (!user) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      or(
        where('userId', '==', user.uid),
        where('assignedTo', 'array-contains', user.uid)
      ),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));

    // Sync Subscription
    const unsubscribeSub = onSnapshot(doc(db, 'subscriptions', user.uid), (snap) => {
      if (snap.exists()) {
        setSubscription(snap.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `subscriptions/${user.uid}`));

    let unsubscribeInst: (() => void) | null = null;
    let unsubscribeMembers: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;

    const userDoc = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        // If userData has a theme preference, ensure ThemeProvider is in sync
        // Note: App doesn't call setTheme here to avoid loop if ThemeProvider handled it,
        // but we want the CSS classes to be correct.
        // Actually ThemeProvider's useEffect handles classes based on its state.
        // If we want to sync Firestore -> Provider, we do it in a separate effect or here.

        if (data.activeModules) {
          setModules(prev => prev.map(m => ({ ...m, active: data.activeModules.includes(m.id) })));
        }

        if (data.institutionId) {
          // Cleanup previous institution listeners if ID changed
          if (unsubscribeInst) unsubscribeInst();
          if (unsubscribeMembers) unsubscribeMembers();
          if (unsubscribeUsers) unsubscribeUsers();

          // Sync Institution
          unsubscribeInst = onSnapshot(doc(db, 'institutions', data.institutionId), (instSnap) => {
            if (instSnap.exists()) {
              setInstitution({ id: instSnap.id, ...instSnap.data() } as Institution);
            }
          }, (error) => handleFirestoreError(error, OperationType.GET, `institutions/${data.institutionId}`));

          // Sync Members
          const membersQuery = collection(db, 'institutions', data.institutionId, 'members');
          unsubscribeMembers = onSnapshot(membersQuery, async (membersSnap) => {
            const usersQuery = query(
              collection(db, 'users'),
              where('institutionId', '==', data.institutionId)
            );
            
            if (unsubscribeUsers) unsubscribeUsers();
            unsubscribeUsers = onSnapshot(usersQuery, (uSnap) => {
              const membersData = uSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
              setUsers(membersData);
            }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
          }, (error) => handleFirestoreError(error, OperationType.LIST, `institutions/${data.institutionId}/members`));
        }
      } else {
        setDoc(userDoc, {
          id: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email,
          role: 'MEMBER',
          activeModules: MODULES.filter(m => m.active).map(m => m.id)
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    return () => {
      unsubscribeTasks();
      unsubscribeUser();
      unsubscribeSub();
      if (unsubscribeInst) unsubscribeInst();
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [user]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(t => {
    const search = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search) ||
      t.moduleId?.toLowerCase().includes(search) ||
      t.assignedByName?.toLowerCase().includes(search) ||
      t.tags?.some(tag => tag.toLowerCase().includes(search))
    );
  });

  const addTask = async (data: any) => {
    if (!user || !userData) return;

    const isDelegated = (data.assignedTo && data.assignedTo.length > 0) || (data.assignedToGroups && data.assignedToGroups.length > 0);

    if (isLimitReached && !isDelegated) {
      setIsUpgradeDialogOpen(true);
      return;
    }

    try {
      const batch = writeBatch(db);
      const taskRef = doc(collection(db, 'tasks'));
      const taskId = taskRef.id;
      const ticketNumber = `OH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Burst Rate Limit Logic
      const lastTs = userData.lastTaskCreatedAt?.toMillis() || 0;
      const now = Date.now();
      const isReset = now > lastTs + 10000;

      // Update user's rate limit state
      batch.update(doc(db, 'users', user.uid), {
        lastTaskCreatedAt: serverTimestamp(),
        burstCount: isReset ? 1 : increment(1)
      });

      const isProfessional = data.moduleId === 'profissional';
      const needsApproval = isProfessional && userData.role === 'MEMBER';

      const taskData = {
        ...data,
        id: taskId,
        ticketNumber,
        userId: user.uid,
        status: needsApproval ? 'PENDING_APPROVAL' : (isDelegated ? 'ASSIGNED' : 'PENDING'),
        completed: false,
        createdAt: serverTimestamp(),
        type: isDelegated || isProfessional ? 'INSTITUTIONAL' : 'PERSONAL',
        assignedBy: isDelegated ? user.uid : null,
        assignedByName: isDelegated ? (user.displayName || 'Admin') : null,
        assignedTo: data.assignedTo || [],
        assignedToGroups: data.assignedToGroups || [],
        institutionId: userData.institutionId || null,
        viewed: false,
        read: false,
        targetDate: new Date().toISOString().split('T')[0],
        deadlineAt: data.deadlineAt || null, // Fixes the undefined error
      };

      // Remove undefined fields
      const cleanedTaskData = Object.fromEntries(
        Object.entries(taskData).filter(([_, v]) => v !== undefined)
      );

      batch.set(taskRef, cleanedTaskData);

      // Create Notification if delegated or needs approval
      if (needsApproval && userData.institutionId) {
        // Notify Managers
        const managersQuery = query(
          collection(db, 'users'), 
          where('institutionId', '==', userData.institutionId),
          where('role', 'in', ['ADMIN', 'MANAGER'])
        );
        // Note: we can't easily wait for this inside batch without fetching first.
        // For now, manager checks the "Gestão de Tarefas" tab.
        // But we should create at least one notification for the first manager found or a general one.
      }

      if (isDelegated && !needsApproval) {
        data.assignedTo?.forEach((targetUserId: string) => {
          if (targetUserId !== user.uid) {
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
              userId: targetUserId,
              type: 'TASK_DELEGATED',
              title: 'Nova Tarefa Delegada',
              message: `${user.displayName || 'Um administrador'} delegou a tarefa "${data.title}" para você. (Ticket: ${ticketNumber})`,
              read: false,
              resourceId: taskId,
              senderId: user.uid,
              senderName: user.displayName || 'Admin',
              createdAt: serverTimestamp(),
            });
          }
        });
      }

      // Create Task Creation Notification
      const creatorNotifRef = doc(collection(db, 'notifications'));
      batch.set(creatorNotifRef, {
        userId: user.uid,
        type: 'TASK_CREATED',
        title: 'Nova Tarefa Criada',
        message: `Você criou a tarefa "${data.title}" com sucesso. Ticket: ${ticketNumber}`,
        read: false,
        resourceId: taskId,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      setIsDialogOpen(false);
      toast.success(needsApproval ? 'Tarefa enviada para aprovação!' : (isDelegated ? 'Tarefa delegada com sucesso!' : 'Tarefa criada com sucesso!'));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      const { id, ...data } = updatedTask;
      // Filter out fields that shouldn't be updated or need special handling
      const { createdAt, ...updateData } = data as any;
      await updateDoc(doc(db, 'tasks', id), updateData);
      
      if (selectedTask?.id === id) setSelectedTask(updatedTask);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${updatedTask.id}`);
    }
  };

  const updateTaskQuadrant = async (taskId: string, newQuadrant: EisenhowerQuadrant) => {
    const oldTasks = [...tasks];
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    // Optimistic Update
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], quadrant: newQuadrant };
    setTasks(updatedTasks);

    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        quadrant: newQuadrant
      });
    } catch (error) {
      setTasks(oldTasks); // Rollback on error
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  // Phase 9: Deadline Notifications
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const checkDeadlines = async () => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // 1. Move expired tasks to NOW
      const tasksExpired = tasks.filter(t => {
        if (!t.deadlineAt || t.completed || t.quadrant === 'urgent-important') return false;
        return t.deadlineAt < today.getTime();
      });

      for (const t of tasksExpired) {
        updateDoc(doc(db, 'tasks', t.id), { quadrant: 'urgent-important' })
          .then(() => toast.info(`Vencimento: "${t.title}" movida para FAZER AGORA.`))
          .catch(e => console.error(e));
      }

      // 2. Notify tomorrow deadlines
      const tasksDueTomorrow = tasks.filter(t => {
        if (!t.deadlineAt || t.completed) return false;
        const d = new Date(t.deadlineAt);
        return d >= tomorrow && d < dayAfterTomorrow;
      });

      for (const task of tasksDueTomorrow) {
        const notificationId = `deadline_${task.id}_${tomorrow.getTime()}`;
        const notifiedKey = `notified_${notificationId}`;
        
        if (localStorage.getItem(notifiedKey)) continue;

        // Notify current user via toast
        toast.info(`Prazo amanhã: ${task.title}`, {
          description: "Esta tarefa expira em 24h.",
          duration: 10000
        });

        // Create notification documents in Firestore for the assigned user and the manager (if institutional)
        try {
          const recips = new Set(task.assignedTo || []);
          recips.add(task.userId);
          if (task.delegatedBy) recips.add(task.delegatedBy);

          for (const recipientId of recips) {
            await addDoc(collection(db, 'notifications'), {
              userId: recipientId,
              title: 'Tarefa Próxima do Prazo',
              message: `A tarefa "${task.title}" vence amanhã.`,
              taskId: task.id,
              type: 'DEADLINE_REMINDER',
              createdAt: serverTimestamp(),
              read: false
            });
          }
        } catch (err) {
          console.error('Falha ao criar notificações:', err);
        }
        
        localStorage.setItem(notifiedKey, 'true');
      }
    };

    const interval = setInterval(checkDeadlines, 1000 * 60 * 60); // Check every hour
    checkDeadlines();
    return () => clearInterval(interval);
  }, [user, tasks]);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completed: !task.completed,
        status: !task.completed ? 'COMPLETED' : 'PENDING'
      });

      // Create Notification if completed and was delegated
      if (!task.completed && task.assignedBy && task.assignedBy !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: task.assignedBy,
          type: 'TASK_COMPLETED',
          title: 'Tarefa Concluída',
          message: `${user.displayName || 'Um membro'} concluiu a tarefa "${task.title}".`,
          read: false,
          resourceId: id,
          senderId: user.uid,
          senderName: user.displayName || 'Membro',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Delete Task
      batch.delete(doc(db, 'tasks', id));

      // Audit Log with predictable ID for rules
      const logRef = doc(db, 'audit_logs', `${id}_delete`);
      batch.set(logRef, {
        userId: user.uid,
        action: 'DELETE_TASK',
        resource: `tasks/${id}`,
        timestamp: serverTimestamp(),
        details: { taskId: id }
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const openAddTask = (quadrant?: EisenhowerQuadrant, data?: { title: string; description: string; quadrant: EisenhowerQuadrant; moduleId: string }) => {
    if (data) {
      addTask(data);
      return;
    }
    setActiveQuadrant(quadrant);
    setIsDialogOpen(true);
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const toggleModule = async (id: string) => {
    if (!user) return;
    
    // Check module limit
    const activeCount = modules.filter(m => m.active).length;
    const isActivating = !modules.find(m => m.id === id)?.active;
    
    if (isActivating && activeCount >= limits.modules) {
      setIsUpgradeDialogOpen(true);
      return;
    }

    const newModules = modules.map(m => m.id === id ? { ...m, active: !m.active } : m);
    setModules(newModules);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        activeModules: newModules.filter(m => m.active).map(m => m.id)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleLogout = () => logout();

  const handleUpgrade = async () => {
    if (!user) return;
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${apiUrl}/create-checkout-session`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.uid })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao criar sessão de checkout');
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Erro no upgrade:', error);
      toast.error(error.message || 'Erro ao processar upgrade');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Phase 7: Protection of Routes
  if (!user) {
    return <AuthSelector />;
  }

  if (authLoading || (!userData && !authUserData)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Carregando sua jornada...</p>
        </div>
      </div>
    );
  }

  // If logged in but no profile type selected, force selection
  if (!profileType) {
    return <AuthSelector />;
  }

  // Phase 5: Test Mode for Institution
  if (window.location.pathname === '/test/institution') {
    return (
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold">Modo de Teste: Institucional</h1>
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p>Simulando: <strong>Membro de Instituição</strong></p>
          <p>UserType: <code>institution_member</code> (mapeado para <code>institutional</code> no sistema)</p>
        </div>
        <Button onClick={() => {
          localStorage.setItem('userType', 'institutional');
          window.location.reload();
        }}>
          Ativar Modo Institucional Real
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold mb-2">Dashboard Institucional</h3>
            <p className="text-sm text-muted-foreground mb-4">Teste o layout de 3 colunas e usuários online.</p>
            <Button variant="outline" onClick={() => setActiveView('dashboard')}>Ver Dashboard</Button>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold mb-2">Sistema de Tickets</h3>
            <p className="text-sm text-muted-foreground mb-4">Teste a delegação de tarefas e aceite/recusa.</p>
            <Button variant="outline" onClick={() => setActiveView('profissional')}>Ver Profissional</Button>
          </Card>
        </div>
      </div>
    );
  }

  // Phase 7: Block institutional routes for personal users
  if (profileType === 'personal' && (activeView === 'profissional' || activeView === 'institution')) {
    setActiveView('dashboard');
    toast.error('Acesso restrito a membros institucionais');
  }

  const handleTaskComplete = async (taskId: string, timeSpent: number) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        completed: true,
        status: 'COMPLETED',
        timeSpent: increment(timeSpent),
        completedAt: Date.now()
      });
      setFocusedTaskId(null);
      toast.success('Tarefa concluída com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const quadrantStats = [
    { name: 'Fazer Agora', value: tasks.filter(t => t.quadrant === 'urgent-important').length, color: '#ef4444' },
    { name: 'Agendar', value: tasks.filter(t => t.quadrant === 'important-not-urgent').length, color: '#3b82f6' },
    { name: 'Delegar', value: tasks.filter(t => t.quadrant === 'urgent-not-important').length, color: '#f59e0b' },
    { name: 'Eliminar', value: tasks.filter(t => t.quadrant === 'not-urgent-not-important').length, color: '#64748b' },
  ];

  const completionStats = [
    { name: 'Concluídas', value: tasks.filter(t => t.completed).length },
    { name: 'Pendentes', value: tasks.filter(t => !t.completed).length },
  ];

  const moduleTimeStats = modules.map(m => {
    const moduleTasks = tasks.filter(t => t.moduleId === m.id && t.completed && t.timeSpent);
    const avgTimeSeconds = moduleTasks.length > 0 
      ? Math.round(moduleTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0) / moduleTasks.length)
      : 0;
    
    // Format for display: if > 60m, show hours, else minutes
    const value = avgTimeSeconds / 60; // base value in minutes for the chart
    const label = avgTimeSeconds < 3600 
      ? `${Math.round(avgTimeSeconds / 60)}m` 
      : `${(avgTimeSeconds / 3600).toFixed(1)}h`;

    return { name: m.name, value, label };
  }).filter(s => s.value > 0);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('isSidebarCollapsed', String(newState));
  };

  const sidebarItems: { id: View; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Minhas Tarefas', icon: CalendarIcon },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'ordem-no-caos', label: 'Ordem no Caos', icon: Layers },
    { id: 'missions', label: 'Missões', icon: Trophy },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'logistics', label: 'Logística', icon: MapPin },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'plans', label: 'Planos', icon: CreditCard },
  ];

  if (userData?.institutionId && (userData?.role === 'ADMIN' || userData?.role === 'MANAGER')) {
    sidebarItems.push({ id: 'institution', label: 'Gestão Institucional', icon: Building2 });
  }

  return (
    <TooltipProvider>
      <div className="flex bg-background text-foreground min-h-screen relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r z-[101] md:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                    {logoURL ? <img src={logoURL} className="w-full h-full object-cover" /> : 'O'}
                  </div>
                  <h1 className="text-xl font-bold tracking-tighter">OHEL</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
                {sidebarItems.map(item => {
                  const isActive = activeView === item.id;
                  return (
                    <Button 
                      key={item.id}
                      variant={isActive ? 'secondary' : 'ghost'} 
                      className={cn(
                        "w-full justify-start gap-3 h-12 rounded-xl px-4",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                      onClick={() => {
                        setActiveView(item.id as View);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                      <span className="font-semibold text-sm">{item.label}</span>
                    </Button>
                  );
                })}
              </nav>

              <div className="p-4 border-t space-y-2">
                <ThemeToggle userId={user?.uid} />
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="w-full justify-start gap-3 text-destructive h-12 rounded-xl"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold">Sair</span>
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        "border-r bg-muted/20 flex flex-col hidden md:flex transition-all duration-300 relative min-h-screen",
        isFocusMode ? "w-0 opacity-0 overflow-hidden border-none" : (isSidebarCollapsed ? "w-20" : "w-64")
      )}>
        {/* Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border bg-background shadow-md z-50 hover:bg-muted"
        >
          {isSidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </Button>

        <div className={cn("p-6 flex flex-col gap-4", isSidebarCollapsed && "items-center px-0")}>
          <div className="flex items-center gap-3 relative group">
            <div className={cn(
              "bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 glow-blue overflow-hidden transition-all relative shrink-0",
              isSidebarCollapsed ? "w-8 h-8" : "w-10 h-10"
            )}>
              {logoURL ? (
                <img src={logoURL} className="w-full h-full object-cover" />
              ) : 'O'}
              
              {userData?.role === 'ADMIN' && !isSidebarCollapsed && (
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const url = reader.result as string;
                        setLogoURL(url);
                        // Save to settings
                        try {
                          await setDoc(doc(db, 'settings', 'appearance'), { 
                            logoURL: url,
                            updatedBy: user.uid,
                            updatedAt: Date.now()
                          }, { merge: true });
                          toast.success('Logo da empresa atualizado!');
                        } catch (err) {
                          console.error(err);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="text-xl font-bold tracking-tighter leading-none">OHEL</h1>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">SISTEMA DE GESTÃO</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map(item => {
            const isActive = activeView === item.id;
            const content = (
              <Button 
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'} 
                className={cn(
                  "w-full justify-start gap-3 transition-all h-10 group relative",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                  isSidebarCollapsed && "justify-center p-0"
                )}
                onClick={() => setActiveView(item.id as View)}
              >
                <item.icon className={cn(
                  "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive && "text-primary fill-primary/10"
                )} />
                {!isSidebarCollapsed && <span className="truncate font-medium">{item.label}</span>}
                {isSidebarCollapsed && isActive && (
                  <span className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Button>
            );

            if (isSidebarCollapsed) {
              return (
                <React.Fragment key={item.id}>
                  <TooltipUI>
                    <TooltipTrigger 
                      render={content}
                    />
                    <TooltipContent side="right" className="font-bold">
                      {item.label}
                    </TooltipContent>
                  </TooltipUI>
                </React.Fragment>
              );
            }

            return content;
          })}
        </nav>

        <div className={cn("p-4 border-t space-y-1", isSidebarCollapsed && "px-2")}>
          <ThemeToggle userId={user?.uid} collapsed={isSidebarCollapsed} />

          {isSidebarCollapsed ? (
            <TooltipUI>
              <TooltipTrigger 
                render={
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout} 
                    className="w-full justify-center p-0 h-10 text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                }
              />
              <TooltipContent side="right" className="font-bold">Sair</TooltipContent>
            </TooltipUI>
          ) : (
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-md z-10 transition-all sticky top-0",
          isFocusMode && "h-0 opacity-0 overflow-hidden border-none"
        )}>
          <div className="flex items-center gap-3 md:gap-6 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            
            <div className="relative max-w-sm w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar tarefas..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell userId={user.uid} onNavigate={setActiveView} />
            <div className="h-8 w-[1px] bg-border mx-2"></div>
            <div 
              className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-muted/50 p-1 rounded-lg transition-colors group relative"
              onClick={() => setActiveView('profile')}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{userData?.name || user.displayName || 'Usuário'}</p>
                {subscription?.status === 'BLOCKED' ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveView('plans');
                    }} 
                    className="text-[10px] text-destructive font-bold hover:underline"
                  >
                    CONTA BLOQUEADA - RESOLVER
                  </button>
                ) : (
                  <p className="text-[10px] text-muted-foreground">{subscription?.planType || 'Plano Free'}</p>
                )}
              </div>
              <div 
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden relative border-2 border-transparent group-hover:border-primary/50 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  avatarInputRef.current?.click();
                }}
              >
                {userData?.photoURL || user.photoURL ? (
                  <img 
                    src={userData?.photoURL || user.photoURL} 
                    alt={user.displayName || 'User'} 
                    referrerPolicy="no-referrer" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
              <input 
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView + (isFocusMode ? '-focus' : '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "max-w-7xl mx-auto space-y-6 h-full",
                isFocusMode && "max-w-3xl pt-20"
              )}
            >
              {isFocusMode ? (
                <div className="space-y-12">
                  <div className="text-center space-y-4">
                    <h2 className="text-5xl font-bold tracking-tighter text-glow-blue">Foco Total</h2>
                    <p className="text-muted-foreground">Elimine distrações. Apenas o essencial importa agora.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                    <PomodoroTimer 
                      taskTitle={tasks.find(t => t.id === focusedTaskId)?.title}
                      onComplete={() => {
                        if (focusedTaskId) {
                          toggleTask(focusedTaskId);
                          setFocusedTaskId(null);
                        }
                      }}
                    />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-primary" />
                        Tarefas para Hoje
                      </h3>
                      <div className="space-y-3">
                        {tasks.filter(t => !t.completed).slice(0, 3).map(task => (
                          <div 
                            key={task.id} 
                            className="p-6 bg-card border rounded-3xl flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer glow-blue"
                            onClick={() => setFocusedTaskId(task.id)}
                          >
                            <span className="text-lg font-medium">{task.title}</span>
                            <Button variant="ghost" size="icon" onClick={() => toggleTask(task.id)}>
                              <CheckSquare className="w-6 h-6" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => setIsFocusMode(false)} className="text-muted-foreground">
                      Sair do Modo Foco
                    </Button>
                  </div>
                </div>
              ) : (
                <>
              {activeView === 'dashboard' ? (
                <Dashboard 
                  tasks={tasks} 
                  users={users.length > 0 ? users : [{
                    id: user.uid,
                    name: user.displayName || 'Você',
                    email: user.email || '',
                    role: 'MEMBER',
                    status: 'online'
                  }]} 
                  currentUser={(userData || authUserData) as User}
                  onTaskClick={openTaskDetails}
                  onUserClick={(member) => {
                    setSelectedUser(member);
                    setActiveView('messages');
                  }}
                  onAddAppointment={() => {
                    setActiveQuadrant('urgent-important');
                    setIsDialogOpen(true);
                  }}
                  onUpdateJourney={async (days) => {
                    if (!user) return;
                    await updateDoc(doc(db, 'users', user.uid), { journeyTotalDays: days });
                    toast.success('Jornada atualizada!');
                  }}
                  subscription={subscription}
                  onNavigate={setActiveView}
                  onToggleFocus={() => setIsFocusMode(true)}
                  onCompleteTask={toggleTask}
                  onRegenerateInviteCode={async () => {
                    if (!user) return;
                    
                    try {
                      let instId = userData?.institutionId;
                      
                      if (!instId) {
                        // Create new institution
                        const newInstId = `inst-${user.uid.substring(0, 5)}_${Date.now()}`;
                        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                        
                        const batch = writeBatch(db);
                        
                        // 1. Create Institution
                        batch.set(doc(db, 'institutions', newInstId), {
                          id: newInstId,
                          name: `Instituição de ${user.displayName || 'Membro'}`,
                          inviteCode: inviteCode,
                          planType: 'BASIC',
                          createdAt: serverTimestamp(),
                          createdBy: user.uid
                        });
                        
                        // 2. Add as Admin Member
                        batch.set(doc(db, 'institutions', newInstId, 'members', user.uid), {
                          userId: user.uid,
                          role: 'ADMIN',
                          joinedAt: serverTimestamp()
                        });
                        
                        // 3. Update User
                        batch.update(doc(db, 'users', user.uid), {
                          institutionId: newInstId,
                          role: 'ADMIN'
                        });
                        
                        // 4. Update Subscription
                        batch.set(doc(db, 'subscriptions', user.uid), {
                          userId: user.uid,
                          planType: 'BASIC',
                          status: 'ACTIVE'
                        }, { merge: true });
                        
                        await batch.commit();
                        setProfileType('institutional');
                        toast.success('Você agora é uma Instituição! Código gerado.');
                        return;
                      }

                      if (userData.role !== 'ADMIN' && userData.role !== 'MANAGER') {
                        toast.error('Apenas gestores podem regenerar o código.');
                        return;
                      }
                      
                      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                      await updateDoc(doc(db, 'institutions', instId), {
                        inviteCode: newCode
                      });
                      toast.success('Código de convite regenerado!');
                    } catch (error) {
                      handleFirestoreError(error, OperationType.UPDATE, 'institutions');
                    }
                  }}
                  institution={institution}
                />
              ) : activeView === 'calendar' ? (
                <CalendarView 
                  tasks={tasks} 
                  onTaskClick={openTaskDetails} 
                  onDayClick={(day) => {
                    setActiveQuadrant('important-not-urgent');
                    setIsDialogOpen(true);
                  }}
                />
              ) : activeView === 'missions' ? (
                <MissionsView 
                  user={(userData || authUserData) as User}
                  tasks={tasks}
                  modules={modules}
                  rankings={rankings}
                />
              ) : activeView === 'logistics' ? (
                <LogisticsView 
                  user={(userData || authUserData) as User}
                />
              ) : activeView === 'messages' ? (
                <MessagesView 
                  currentUser={(userData || authUserData) as User}
                  users={users}
                  messages={messages}
                  tasks={tasks}
                  onSendMessage={async (m) => {
                    await addDoc(collection(db, 'messages'), {
                      ...m,
                      createdAt: serverTimestamp()
                    });
                  }}
                />
              ) : activeView === 'institution' ? (
                <InstitutionPanel 
                  user={(userData || authUserData) as User}
                  institution={institution} 
                  users={users} 
                  onJoin={() => {}} // Handled by auth flow now
                  onDelegateTask={async (uid, data) => {
                    try {
                      await addDoc(collection(db, 'tasks'), {
                        ...data,
                        userId: uid,
                        moduleId: 'PROFISSIONAL',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        completed: false,
                        assignedTo: [uid],
                        delegatedBy: user.uid,
                        institutionId: userData?.institutionId
                      });

                      // Create Notification for the delegated user
                      await addDoc(collection(db, 'notifications'), {
                        userId: uid,
                        type: 'TASK_DELEGATED',
                        title: 'Nova Tarefa Delegada',
                        message: `${user.displayName || 'Um administrador'} delegou uma tarefa para você no painel institucional.`,
                        read: false,
                        senderId: user.uid,
                        senderName: user.displayName || 'Admin',
                        createdAt: serverTimestamp(),
                      });

                      toast.success('Tarefa delegada!');
                    } catch (error) {
                      handleFirestoreError(error, OperationType.CREATE, 'tasks');
                    }
                  }}
                />
              ) : activeView === 'ordem-no-caos' ? (
                <OrdemNoCaos onNavigate={setActiveView} profileType={profileType || 'personal'} />
              ) : activeView === 'profile' ? (
                <ProfilePage 
                  user={(userData || authUserData) as User} 
                  subscription={subscription} 
                  onNavigate={setActiveView}
                />
              ) : activeView === 'spiritual' ? (
                <SpiritualModule userId={user.uid} onAddTask={addTask} />
              ) : activeView === 'profissional' ? (
                <ProfessionalModule userId={user.uid} institutionId={userData?.institutionId} defaultTab={professionalDefaultTab} />
              ) : activeView === 'familiar' ? (
                <PersonalModule userId={user.uid} />
              ) : activeView === 'fitness' ? (
                <FitnessModule userId={user.uid} />
              ) : activeView === 'biblioteca' ? (
                <LibraryModule userId={user.uid} />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        {sidebarItems.find(i => i.id === activeView)?.label}
                      </h2>
                      <p className="text-muted-foreground">
                        {activeView === 'matrix' && 'Organize suas tarefas pela importância e urgência.'}
                        {activeView === 'calendar' && 'Visualize seus compromissos e tarefas no tempo.'}
                        {activeView === 'focus' && 'Mantenha o foco na tarefa mais importante agora.'}
                        {activeView === 'stats' && 'Acompanhe como você está distribuindo seu tempo.'}
                        {activeView === 'modules' && 'Ative ou desative contextos específicos da sua vida.'}
                        {activeView === 'institution' && 'Colabore com sua equipe e delegue responsabilidades.'}
                        {activeView === 'plans' && 'Escolha o plano ideal para suas necessidades.'}
                        {activeView === 'notifications' && 'Fique por dentro de tudo o que acontece na sua conta.'}
                      </p>
                    </div>
                    {activeView === 'matrix' && (
                      <Button onClick={() => openAddTask()} className="gap-2 rounded-full shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        Nova Tarefa
                      </Button>
                    )}
                  </div>

                  {activeView === 'matrix' && (
                    <EisenhowerMatrix 
                      tasks={filteredTasks}
                      onToggleTask={toggleTask}
                      onDeleteTask={deleteTask}
                      onAddTask={openAddTask}
                      onTaskClick={openTaskDetails}
                      onUpdateTaskQuadrant={updateTaskQuadrant}
                    />
                  )}
                </>
              )}
              </>
              )}

            {activeView === 'focus' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <PomodoroTimer 
                    taskTitle={tasks.find(t => t.id === focusedTaskId)?.title}
                    focusedTaskId={focusedTaskId}
                    onTaskComplete={(timeSpent) => {
                      if (focusedTaskId) {
                        handleTaskComplete(focusedTaskId, timeSpent);
                      }
                    }}
                    onComplete={() => {
                      if (focusedTaskId) {
                        // Optional: auto-complete or just notify
                      }
                    }}
                  />
                  {focusedTaskId && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium">Focando em: {tasks.find(t => t.id === focusedTaskId)?.title}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setFocusedTaskId(null)}>Trocar</Button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    Tarefas Prioritárias (Quadrante 1)
                  </h3>
                  <div className="space-y-3">
                    {filteredTasks.filter(t => t.quadrant === 'urgent-important' && !t.completed).map(task => (
                      <div 
                        key={task.id} 
                        className={cn(
                          "p-4 bg-card border rounded-xl flex items-center justify-between group transition-all cursor-pointer",
                          focusedTaskId === task.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                        )}
                        onClick={() => setFocusedTaskId(task.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-sm font-medium">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {focusedTaskId === task.id ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Focando</Badge>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              openTaskDetails(task);
                            }}>Detalhes</Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredTasks.filter(t => t.quadrant === 'urgent-important' && !t.completed).length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground text-sm">
                        Nenhuma tarefa urgente e importante pendente.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'stats' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-6">Distribuição por Quadrante</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quadrantStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {quadrantStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-6">Status de Execução</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={completionStats}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border rounded-xl p-6 lg:col-span-2">
                  <h3 className="font-semibold mb-6">Tempo Médio por Categoria</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moduleTimeStats} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} />
                        <RechartsTooltip 
                          formatter={(value: any, name: any, props: any) => [props.payload.label, 'Tempo Médio']}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'modules' && (
              <ModuleManagement modules={modules} onToggleModule={toggleModule} />
            )}

            {activeView === 'institution' && (
              <InstitutionPanel 
                user={(userData || authUserData) as User}
                institution={institution} 
                users={users} 
                onJoin={() => {}} // Handled by auth flow now
                onDelegateTask={async (uid, data) => {
                  try {
                    await addDoc(collection(db, 'tasks'), {
                      ...data,
                      userId: uid,
                      moduleId: 'PROFISSIONAL',
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                      completed: false,
                      assignedTo: [uid],
                      delegatedBy: user.uid,
                      institutionId: userData?.institutionId
                    });
                    toast.success('Tarefa delegada!');
                  } catch (error) {
                    handleFirestoreError(error, OperationType.CREATE, 'tasks');
                  }
                }}
              />
            )}

            {activeView === 'notifications' && (
              <NotificationsPage userId={user.uid} onNavigate={setActiveView} />
            )}

            {activeView === 'plans' && <PlanSelector onUpgrade={handleUpgrade} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>

      {/* Add Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <TaskForm 
            initialQuadrant={activeQuadrant}
            users={users}
            modules={modules}
            onSubmit={addTask}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          {selectedTask && (
            <TaskDetails 
              task={selectedTask} 
              onUpdate={updateTask}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl">Limite do Plano Atingido</DialogTitle>
            <DialogDescription className="pt-2">
              Você atingiu o limite de {limits.tasks} tarefas do seu plano <strong>{currentPlan}</strong>. 
              Faça um upgrade para continuar organizando sua rotina sem limites.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span>Tarefas ilimitadas no plano PRO</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
              <Layers className="w-4 h-4 text-primary" />
              <span>Até 5 módulos simultâneos</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUpgradeDialogOpen(false)}>Depois</Button>
            <Button onClick={handleUpgrade} className="gap-2">
              Fazer Upgrade
              <Zap className="w-4 h-4 fill-current" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  </TooltipProvider>
  );
}

const ThemeToggle = ({ userId, collapsed }: { userId?: string; collapsed?: boolean }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const content = (
    <Button 
      variant="ghost" 
      className={cn(
        "w-full justify-start gap-3 h-10 transition-all",
        collapsed && "justify-center p-0"
      )}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </div>
      {!collapsed && <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>}
    </Button>
  );

  if (collapsed) {
    return (
      <TooltipUI>
        <TooltipTrigger 
          render={content}
        />
        <TooltipContent side="right" className="font-bold">
          {isDark ? 'Mudar para Claro' : 'Mudar para Escuro'}
        </TooltipContent>
      </TooltipUI>
    );
  }

  return content;
}

