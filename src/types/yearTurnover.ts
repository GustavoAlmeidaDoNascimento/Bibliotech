export interface AcademicYear {
  id: string;
  year: string; // "2024", "2025"
  startDate: Date;
  endDate: Date;
  status: 'active' | 'archived';
  userId: string;
  createdAt: Date;
  archivedAt?: Date;
}

export interface ClassMapping {
  id: string;
  fromClass: string; // "1º Ano A"
  fromShift: string;
  fromLevelId: string; // educationalLevelId
  toClass: string; // "2º Ano A"
  toShift: string;
  toLevelId: string;
  splitRatio?: number; // Para divisões: 0.5 = 50% dos alunos
  action: 'promote' | 'split' | 'merge' | 'unchanged';
}

export interface StudentAction {
  studentId: string;
  studentName: string;
  fromClass: string;
  fromShift: string;
  action: 'promote' | 'retain' | 'transfer' | 'graduate';
  toClass?: string;
  toShift?: string;
  toLevelId?: string;
  notes?: string;
  hasActiveLoans: boolean;
  activeLoansCount: number;
}

export interface YearTurnoverConfig {
  fromYear: string;
  toYear: string;
  classMappings: ClassMapping[];
  studentActions: StudentAction[];
  newClasses?: NewClass[]; // Novas turmas criadas para o próximo ano
  executeAt?: Date;
}

export interface NewClass {
  id: string;
  name: string;
  shift: string;
  levelId: string;
}

export interface YearTurnoverHistory {
  id: string;
  fromYear: string;
  toYear: string;
  executedAt: Date;
  executedBy: string; // userId
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  statistics: TurnoverStatistics;
  userId: string;
  error?: string;
}

export interface TurnoverStatistics {
  totalStudents: number;
  promoted: number;
  retained: number;
  transferred: number;
  graduated: number;
  studentsDeleted: number; // transferred + graduated
  classesCreated: number;
  classesArchived: number;
  activeLoansKept: number; // Empréstimos que ficaram ativos (de alunos deletados)
}

export interface ClassGroup {
  className: string;
  shift: string;
  levelId: string;
  levelName: string;
  students: StudentAction[];
  mappedTo?: {
    className: string;
    shift: string;
    levelId: string;
  }[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'missing_level' | 'no_action' | 'no_mapping' | 'duplicate_mapping' | 'invalid_target';
  message: string;
  affectedItems: string[];
}

export interface ValidationWarning {
  type: 'active_loans' | 'no_students' | 'large_class';
  message: string;
  affectedItems: string[];
}

export interface TurnoverStep {
  id: number;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
}

