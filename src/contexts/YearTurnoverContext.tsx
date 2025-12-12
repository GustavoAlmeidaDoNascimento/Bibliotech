import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  YearTurnoverConfig,
  ClassMapping,
  StudentAction,
  ClassGroup,
  TurnoverStep,
  ValidationResult,
  TurnoverStatistics
} from '../types/yearTurnover';

interface YearTurnoverContextType {
  // Estado do processo
  currentStep: number;
  steps: TurnoverStep[];
  config: YearTurnoverConfig;
  
  // Dados carregados
  allClasses: ClassGroup[];
  allStudents: StudentAction[];
  
  // Validação
  validation: ValidationResult | null;
  
  // Estatísticas
  statistics: TurnoverStatistics | null;
  
  // Controle
  isExecuting: boolean;
  isCompleted: boolean;
  error: string | null;
  
  // Métodos
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setConfig: (config: Partial<YearTurnoverConfig>) => void;
  setAllClasses: (classes: ClassGroup[]) => void;
  setAllStudents: (students: StudentAction[]) => void;
  setClassMapping: (mapping: ClassMapping) => void;
  setStudentAction: (action: StudentAction) => void;
  setBulkStudentActions: (actions: StudentAction[]) => void;
  setValidation: (validation: ValidationResult) => void;
  setIsExecuting: (executing: boolean) => void;
  setIsCompleted: (completed: boolean) => void;
  setStatistics: (stats: TurnoverStatistics) => void;
  setError: (error: string | null) => void;
  resetWizard: () => void;
  completeStep: (stepId: number) => void;
}

const YearTurnoverContext = createContext<YearTurnoverContextType | null>(null);

export const useYearTurnover = () => {
  const context = useContext(YearTurnoverContext);
  if (!context) {
    throw new Error('useYearTurnover must be used within a YearTurnoverProvider');
  }
  return context;
};

const initialSteps: TurnoverStep[] = [
  {
    id: 1,
    label: 'Preparação',
    description: 'Validação inicial e carregamento de dados',
    completed: false,
    active: true
  },
  {
    id: 2,
    label: 'Mapeamento de Turmas',
    description: 'Definir destino de cada turma',
    completed: false,
    active: false
  },
  {
    id: 3,
    label: 'Gestão de Alunos',
    description: 'Definir ação para cada aluno',
    completed: false,
    active: false
  },
  {
    id: 4,
    label: 'Revisão',
    description: 'Revisar todas as mudanças',
    completed: false,
    active: false
  },
  {
    id: 5,
    label: 'Execução',
    description: 'Processar virada de ano',
    completed: false,
    active: false
  },
  {
    id: 6,
    label: 'Conclusão',
    description: 'Relatório final',
    completed: false,
    active: false
  }
];

export const YearTurnoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStepState] = useState(1);
  const [steps, setSteps] = useState<TurnoverStep[]>(initialSteps);
  const [config, setConfigState] = useState<YearTurnoverConfig>({
    fromYear: new Date().getFullYear().toString(),
    toYear: (new Date().getFullYear() + 1).toString(),
    classMappings: [],
    studentActions: []
  });
  
  const [allClasses, setAllClasses] = useState<ClassGroup[]>([]);
  const [allStudents, setAllStudents] = useState<StudentAction[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [statistics, setStatistics] = useState<TurnoverStatistics | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    setSteps(prev => prev.map(s => ({
      ...s,
      active: s.id === step
    })));
  }, []);
  
  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length, setCurrentStep]);
  
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);
  
  const setConfig = useCallback((partialConfig: Partial<YearTurnoverConfig>) => {
    setConfigState(prev => ({ ...prev, ...partialConfig }));
  }, []);
  
  const setClassMapping = useCallback((mapping: ClassMapping) => {
    setConfigState(prev => {
      const existingIndex = prev.classMappings.findIndex(
        m => m.fromClass === mapping.fromClass && m.fromShift === mapping.fromShift
      );
      
      if (existingIndex >= 0) {
        // Atualizar mapeamento existente
        const newMappings = [...prev.classMappings];
        newMappings[existingIndex] = mapping;
        return { ...prev, classMappings: newMappings };
      } else {
        // Adicionar novo mapeamento
        return { ...prev, classMappings: [...prev.classMappings, mapping] };
      }
    });
  }, []);
  
  const setStudentAction = useCallback((action: StudentAction) => {
    setConfigState(prev => {
      const existingIndex = prev.studentActions.findIndex(
        a => a.studentId === action.studentId
      );
      
      if (existingIndex >= 0) {
        // Atualizar ação existente
        const newActions = [...prev.studentActions];
        newActions[existingIndex] = action;
        return { ...prev, studentActions: newActions };
      } else {
        // Adicionar nova ação
        return { ...prev, studentActions: [...prev.studentActions, action] };
      }
    });
  }, []);
  
  const setBulkStudentActions = useCallback((actions: StudentAction[]) => {
    setConfigState(prev => {
      // Merge com ações existentes
      const newActions = [...prev.studentActions];
      
      actions.forEach(action => {
        const existingIndex = newActions.findIndex(
          a => a.studentId === action.studentId
        );
        
        if (existingIndex >= 0) {
          newActions[existingIndex] = action;
        } else {
          newActions.push(action);
        }
      });
      
      return { ...prev, studentActions: newActions };
    });
  }, []);
  
  const completeStep = useCallback((stepId: number) => {
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, completed: true } : s
    ));
  }, []);
  
  const resetWizard = useCallback(() => {
    setCurrentStepState(1);
    setSteps(initialSteps);
    setConfigState({
      fromYear: new Date().getFullYear().toString(),
      toYear: (new Date().getFullYear() + 1).toString(),
      classMappings: [],
      studentActions: []
    });
    setAllClasses([]);
    setAllStudents([]);
    setValidation(null);
    setStatistics(null);
    setIsExecuting(false);
    setIsCompleted(false);
    setError(null);
  }, []);
  
  const value: YearTurnoverContextType = {
    currentStep,
    steps,
    config,
    allClasses,
    allStudents,
    validation,
    statistics,
    isExecuting,
    isCompleted,
    error,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    setConfig,
    setAllClasses,
    setAllStudents,
    setClassMapping,
    setStudentAction,
    setBulkStudentActions,
    setValidation,
    setIsExecuting,
    setIsCompleted,
    setStatistics,
    setError,
    resetWizard,
    completeStep
  };
  
  return (
    <YearTurnoverContext.Provider value={value}>
      {children}
    </YearTurnoverContext.Provider>
  );
};

