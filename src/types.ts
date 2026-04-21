export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type EisenhowerQuadrant = 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';

export type PriorityLevel = 'NOW' | 'SCHEDULE' | 'DELEGATE';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'ACCEPTED' | 'REFUSED' | 'PENDING_APPROVAL';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export type PlanType = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'PERSONAL_BASIC' | 'PERSONAL_INTERMEDIATE' | 'PERSONAL_ADVANCED' | 'INSTITUTION_BASIC' | 'INSTITUTION_INTERMEDIATE' | 'INSTITUTION_ADVANCED';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'TRIAL' | 'PAST_DUE';

export interface Subscription {
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  expiresAt?: number;
  stripeCustomerId?: string;
  subscriptionId?: string;
}

export interface PlanConfig {
  maxUsers: number;
  price: string;
  tasks: number;
  modules: number;
}

export const PLAN_LIMITS: Record<string, PlanConfig> = {
  // Legacy
  BASIC: { maxUsers: 1, price: 'R$ 29,90', tasks: 100, modules: 2 },
  INTERMEDIATE: { maxUsers: 5, price: 'R$ 149,90', tasks: 1000, modules: 5 },
  ADVANCED: { maxUsers: Infinity, price: 'R$ 439,90', tasks: Infinity, modules: Infinity },
  
  // PESSOAL (CPF)
  PERSONAL_BASIC: { maxUsers: 2, price: 'R$ 49,90', tasks: 1000, modules: 3 },
  PERSONAL_INTERMEDIATE: { maxUsers: 5, price: 'R$ 69,90', tasks: 5000, modules: 6 },
  PERSONAL_ADVANCED: { maxUsers: 10, price: 'R$ 99,90', tasks: Infinity, modules: 10 },
  
  // INSTITUCIONAL (CNPJ)
  INSTITUTION_BASIC: { maxUsers: 25, price: 'R$ 149,90', tasks: Infinity, modules: 12 },
  INSTITUTION_INTERMEDIATE: { maxUsers: 75, price: 'R$ 449,90', tasks: Infinity, modules: 20 },
  INSTITUTION_ADVANCED: { maxUsers: Infinity, price: 'A COMBINAR', tasks: Infinity, modules: Infinity },
};

export const MEMBER_UPGRADE_PRICE = 'R$ 29,90';

export type TaskType = 'PERSONAL' | 'INSTITUTIONAL';

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: EisenhowerQuadrant;
  status: TaskStatus;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  timeSpent?: number; // in seconds
  dueDate?: number;
  tags?: string[];
  moduleId?: string;
  institutionId?: string;
  type: TaskType;
  assignedBy?: string;
  assignedByName?: string;
  comments?: Comment[];
  attachments?: Attachment[];
  approvalStatus?: ApprovalStatus;
  groupId?: string;
  isPrivate?: boolean;
  deadlineAt?: number;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  ticketNumber?: string;
  assignedToGroups?: string[];
  approvedByManager?: boolean;
}

export interface Module {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  icon: string;
  color: string;
}

export interface Institution {
  id: string;
  name: string;
  inviteCode: string;
  membersCount?: number;
  planType: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  hasAdminDiscount?: boolean;
  trialEndsAt?: number;
  subscriptionStatus?: SubscriptionStatus;
  createdAt?: any;
}

export type UserStatus = 'online' | 'away' | 'busy';
export type UserType = 'personal' | 'institution_owner' | 'institution_member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  type?: UserType;
  institutionId?: string;
  status?: UserStatus;
  photoURL?: string;
  age?: number;
  journeyStart?: number;
  journeyTotalDays?: number;
  profileType?: 'PERSONAL' | 'INSTITUTIONAL';
  phoneNumber?: string;
  socialMedia?: string;
  isPlatformAdmin?: boolean;
}

export const QUADRANT_LABELS: Record<EisenhowerQuadrant, { title: string; subtitle: string; color: string }> = {
  'urgent-important': {
    title: 'Fazer Agora',
    subtitle: 'Urgente e Importante',
    color: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
  },
  'important-not-urgent': {
    title: 'Agendar',
    subtitle: 'Importante, Não Urgente',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
  },
  'urgent-not-important': {
    title: 'Delegar',
    subtitle: 'Urgente, mas Não Importante',
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
  },
  'not-urgent-not-important': {
    title: 'Eliminar',
    subtitle: 'Nem Urgente nem Importante',
    color: 'bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-400',
  },
};

export const MODULES: Module[] = [
  { id: '1', slug: 'pessoal', name: 'Pessoal', active: true, icon: 'User', color: 'bg-blue-500' },
  { id: '2', slug: 'financeiro', name: 'Financeiro', active: true, icon: 'DollarSign', color: 'bg-green-500' },
  { id: '3', slug: 'familiar', name: 'Familiar', active: true, icon: 'Users', color: 'bg-purple-500' },
  { id: '4', slug: 'profissional', name: 'Profissional', active: true, icon: 'Briefcase', color: 'bg-orange-500' },
  { id: '5', slug: 'espiritual', name: 'Espiritual', active: true, icon: 'Heart', color: 'bg-pink-500' },
];

// Finance Module Types
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'Alimentação' | 'Transporte' | 'Moradia' | 'Lazer' | 'Saúde' | 'Educação' | 'Outros';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: any; // Firestore Timestamp
  createdAt: any;
  updatedAt: any;
  taskId?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
}

export interface PixKey {
  id: string;
  userId: string;
  label: string;
  key: string;
  type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  institution?: string;
}

// Spiritual Module Types
export interface Devotional {
  id: string;
  userId: string;
  verse: {
    text: string;
    reference: string;
  };
  notes: string;
  date: string; // YYYY-MM-DD
  createdAt: any;
}

export interface ReadingPlan {
  id: string;
  userId: string;
  book: string;
  totalChapters: number;
  completedChapters: number[];
  startDate: any;
  targetDays: number;
}

export interface SpiritualGoal {
  id: string;
  userId: string;
  title: string;
  progress: number; // 0-100
  completed: boolean;
  createdAt: any;
}

// Professional Module Types
export interface FinancialTransaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE' | 'FIXED' | 'INVESTMENT';
  amount: number;
  description: string;
  date: any;
  category?: string;
}

export interface TeamTask extends Task {
  assignedTo: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'COMPLETED';
  viewed: boolean;
  read: boolean;
  message?: string;
  targetDate: string; // YYYY-MM-DD
}

// Personal/Family Module Types
export interface FamilyEvent {
  id: string;
  userId: string;
  title: string;
  date: any;
  category: 'HOUSE' | 'ROUTINE' | 'EVENT' | 'TASK';
}

// Fitness & Well-being Types
export interface FitnessHabit {
  id: string;
  userId: string;
  name: string;
  type: 'WATER' | 'EXERCISE' | 'HABIT';
  target: number;
  current: number;
  date: string; // YYYY-MM-DD
}

export interface WellBeingLog {
  id: string;
  userId: string;
  mood: number; // 1-5
  energy: number; // 1-5
  date: string;
}

// Library Types
export interface LibraryItem {
  id: string;
  userId: string;
  title: string;
  author?: string;
  coverUrl?: string;
  category: 'BOOK' | 'COURSE' | 'CONTENT';
  progress: number;
  status: 'WANT_TO_READ' | 'READING' | 'COMPLETED';
}

// Mission & Ranking Types
export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: string;
  points: number;
  deadline: number;
  createdBy: string;
  createdAt: number;
  status: 'ACTIVE' | 'EXPIRED';
  authorizedRequired?: boolean;
}

export interface MissionCompletion {
  id: string;
  missionId: string;
  missionTitle?: string;
  userId: string;
  userName: string;
  status: 'PENDING' | 'AUTHORIZED' | 'REJECTED';
  completedAt: number;
  authorizedAt?: number;
  points: number;
}

export interface UserGroup {
  id: string;
  name: string;
  institutionId: string;
  members: string[]; // user IDs
  createdAt: any;
}

export interface Ranking {
  id: string;
  userId: string;
  userName: string;
  points: number;
  weekId: string; // YYYY-WW
}

// Logistics Types
export interface LogisticsAddress {
  id: string;
  userId: string;
  label: string; // "Trabalho", "Casa", etc.
  address: string;
  type: 'WORK' | 'HOME' | 'DELIVERY' | 'OTHER';
  lat?: number;
  lng?: number;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string; // If null, it's a group or broadcast
  groupId?: string;
  taskId?: string; // For ticket-based chat
  text: string;
  createdAt: number;
  read: boolean;
}

// Notification Types
export type NotificationType = 'TASK_DELEGATED' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'COMMENT_ADDED' | 'DEADLINE_REMINDER' | 'MISSION_CREATED' | 'MISSION_COMPLETED' | 'ADMIN_ALERT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  resourceId?: string; // e.g., taskId
  senderId?: string;
  senderName?: string;
  createdAt: any;
}
