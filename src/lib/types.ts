import type { Timestamp } from 'firebase/firestore';

export type Note = {
  id: string;
  content: string;
  lastModified: Timestamp | number;
  userId?: string;
};
