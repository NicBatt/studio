
import type { Timestamp } from 'firebase/firestore';

export type Note = {
  id: string;
  content: string;
  lastModified: Timestamp | number;
  userId?: string;
  date: string; // YYYY-MM-DD format
};

export type Theme = {
    id: string;
    userId: string;
    label: string;
    description?: string;
    color: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
};

export type Recurrence = 
    | { type: 'daily' }
    | { type: 'every_x_days'; days: number }
    | { type: 'weekly'; days: number[] } // 0 for Sunday, 1 for Monday, etc.
    | { type: 'monthly'; day: number }; // 1-31

export type Task = {
    id: string;
    userId: string;
    label: string;
    recurrence: Recurrence;
    startDate: string; // YYYY-MM-DD
    milestoneHalf?: string;
    milestoneFull?: string;
};

export type TaskProgress = 'none' | 'half' | 'full';
