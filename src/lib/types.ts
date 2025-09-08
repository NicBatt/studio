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
