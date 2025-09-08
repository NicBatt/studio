
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, writeBatch, doc, updateDoc, deleteDoc as deleteDocFirestore } from "firebase/firestore";
import type { Theme, Task } from '@/lib/types';
import { toast } from "@/hooks/use-toast";
import { encryptContent, decryptContent } from "./encryption";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, "theme-journal-database");


export const createTheme = async (theme: Omit<Theme, 'id'>): Promise<string | null> => {
    try {
        const themesRef = collection(db, "themes");

        // Check for overlapping themes
        const q = query(themesRef, where("userId", "==", theme.userId));
        const querySnapshot = await getDocs(q);
        const existingThemes = querySnapshot.docs.map(doc => doc.data() as Theme);
        
        const newStart = new Date(theme.startDate);
        const newEnd = new Date(theme.endDate);

        const isOverlapping = existingThemes.some(existingTheme => {
            const existingStart = new Date(existingTheme.startDate);
            const existingEnd = new Date(existingTheme.endDate);
            return (newStart <= existingEnd && newEnd >= existingStart);
        });

        if (isOverlapping) {
            toast({
                variant: 'destructive',
                title: 'Overlapping Themes',
                description: 'The selected date range overlaps with an existing theme.',
            });
            return null;
        }

        const docRef = await addDoc(themesRef, {
             ...theme,
            label: encryptContent(theme.label, theme.userId),
            description: theme.description ? encryptContent(theme.description, theme.userId) : ''
        });
        toast({ title: 'Theme Created!', description: `Theme "${theme.label}" was saved.`});
        return docRef.id;
    } catch (error) {
        console.error("Error creating theme:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not create the new theme. Please try again.',
        });
        return null;
    }
};

export const updateTheme = async (theme: Theme): Promise<void> => {
    try {
        const themeRef = doc(db, 'themes', theme.id);
        await updateDoc(themeRef, {
            ...theme,
            label: encryptContent(theme.label, theme.userId),
            description: theme.description ? encryptContent(theme.description, theme.userId) : ''
        });
        toast({ title: 'Theme Updated!', description: `Theme "${theme.label}" was saved.`});
    } catch (error) {
        console.error('Error updating theme:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update the theme.',
        });
    }
};


export const deleteTheme = async (themeId: string): Promise<void> => {
    try {
        await deleteDocFirestore(doc(db, 'themes', themeId));
        toast({ title: 'Theme Deleted' });
    } catch (error) {
        console.error('Error deleting theme:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the theme.',
        });
    }
};

export const getThemes = (userId: string, callback: (themes: Theme[]) => void) => {
    const q = query(collection(db, "themes"), where("userId", "==", userId));
    return onSnapshot(q, (querySnapshot) => {
        const themes: Theme[] = [];
        querySnapshot.forEach((doc) => {
            const themeData = doc.data() as Omit<Theme, 'id'>;
            themes.push({ 
                id: doc.id, 
                ...themeData,
                label: decryptContent(themeData.label, userId),
                description: themeData.description ? decryptContent(themeData.description, userId) : undefined
            });
        });
        callback(themes);
    });
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<string | null> => {
    try {
        const tasksRef = collection(db, "tasks");
        const docRef = await addDoc(tasksRef, {
            ...task,
            label: encryptContent(task.label, task.userId)
        });
        toast({ title: 'Task Created!', description: `Task "${task.label}" was saved.`});
        return docRef.id;
    } catch (error) {
        console.error("Error creating task:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not create the new task. Please try again.',
        });
        return null;
    }
};

export const updateTask = async (task: Task): Promise<void> => {
    try {
        const taskRef = doc(db, 'tasks', task.id);
        await updateDoc(taskRef, {
            ...task,
            label: encryptContent(task.label, task.userId)
        });
        toast({ title: 'Task Updated!', description: `Task "${task.label}" was saved.`});
    } catch (error) {
        console.error('Error updating task:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update the task.',
        });
    }
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        await deleteDocFirestore(doc(db, 'tasks', taskId));
        toast({ title: 'Task Deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the task.',
        });
    }
};

export const getTasks = (userId: string, callback: (tasks: Task[]) => void) => {
    const q = query(collection(db, "tasks"), where("userId", "==", userId));
    return onSnapshot(q, (querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
            const taskData = doc.data() as Omit<Task, 'id'>;
            tasks.push({ 
                id: doc.id, 
                ...taskData,
                label: decryptContent(taskData.label, userId),
            });
        });
        callback(tasks);
    });
};


export { app, auth, db };
