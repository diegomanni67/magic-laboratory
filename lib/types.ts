export enum UserRole {
  ADMIN = 'ADMIN',
  MASTER = 'MASTER',
  APPRENTICE = 'APPRENTICE',
  EXPERT = 'EXPERT'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  specialties: string[];
  practiceSchedule?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User | null;
  expires: Date;
}
