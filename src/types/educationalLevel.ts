export interface EducationalLevel {
  id: string;
  name: string; // Ex: "1º Ano do Ensino Médio", "5º Ano do Fundamental"
  abbreviation?: string; // Ex: "1EM", "5EF"
  order: number; // Para ordenação (1, 2, 3...)
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EducationalLevelForm {
  name: string;
  abbreviation: string;
  order: number;
}
