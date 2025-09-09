

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, writeBatch, doc, updateDoc, deleteDoc as deleteDocFirestore, setDoc } from "firebase/firestore";
import type { Theme, Task, TaskProgressLog, TaskProgress } from '@/lib/types';
import { toast } from "@/hooks/use-toast";
import { decryptContent, encryptContent } from "./encryption";
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
const db = getFirestore(app);


export const createTheme = async (theme: Omit<Theme, 'id'>, userId: string): Promise<string | null> => {
    try {
        const themesRef = collection(db, "users", userId, "themes");

        // Check for overlapping themes
        const q = query(themesRef); // No need for where clause
        const querySnapshot = await getDocs(q);
        const existingThemes = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Omit<Theme, 'userId'>));
        
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
            label: encryptContent(theme.label, userId),
            description: theme.description ? encryptContent(theme.description, userId) : ''
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

export const updateTheme = async (theme: Omit<Theme, 'userId'>, userId: string): Promise<void> => {
    try {
        const themeRef = doc(db, "users", userId, 'themes', theme.id);
        await updateDoc(themeRef, {
            label: encryptContent(theme.label, userId),
            description: theme.description ? encryptContent(theme.description, userId) : '',
            color: theme.color,
            startDate: theme.startDate,
            endDate: theme.endDate,
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


export const deleteTheme = async (themeId: string, userId: string): Promise<void> => {
    try {
        await deleteDocFirestore(doc(db, "users", userId, 'themes', themeId));
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
    const q = query(collection(db, "users", userId, "themes"));
    return onSnapshot(q, (querySnapshot) => {
        const themes: Theme[] = [];
        querySnapshot.forEach((doc) => {
            const themeData = doc.data();
            themes.push({ 
                id: doc.id, 
                label: decryptContent(themeData.label, userId),
                description: themeData.description ? decryptContent(themeData.description, userId) : undefined,
                color: themeData.color,
                startDate: themeData.startDate,
                endDate: themeData.endDate,
            } as Theme);
        });
        callback(themes);
    }, (error) => {
        console.error("Error fetching themes:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch themes. Please check your connection and security rules."
        })
    });
};

export const createTask = async (task: Omit<Task, 'id' | 'userId'>, userId: string): Promise<string | null> => {
    try {
        const tasksRef = collection(db, "users", userId, "tasks");
        const docRef = await addDoc(tasksRef, {
            ...task,
            label: encryptContent(task.label, userId),
            milestoneHalf: task.milestoneHalf ? encryptContent(task.milestoneHalf, userId) : '',
            milestoneFull: task.milestoneFull ? encryptContent(task.milestoneFull, userId) : '',
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

export const updateTask = async (task: Omit<Task, 'userId'>, userId: string): Promise<void> => {
    try {
        const taskRef = doc(db, "users", userId, 'tasks', task.id);
        await updateDoc(taskRef, {
            label: encryptContent(task.label, userId),
            startDate: task.startDate,
            recurrence: task.recurrence,
            milestoneHalf: task.milestoneHalf ? encryptContent(task.milestoneHalf, userId) : '',
            milestoneFull: task.milestoneFull ? encryptContent(task.milestoneFull, userId) : '',
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

export const deleteTask = async (taskId: string, userId: string): Promise<void> => {
    try {
        await deleteDocFirestore(doc(db, "users", userId, 'tasks', taskId));
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
    const q = query(collection(db, "users", userId, "tasks"));
    return onSnapshot(q, (querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
            const taskData = doc.data();
            tasks.push({ 
                id: doc.id, 
                label: decryptContent(taskData.label, userId),
                recurrence: taskData.recurrence,
                startDate: taskData.startDate,
                milestoneHalf: taskData.milestoneHalf ? decryptContent(taskData.milestoneHalf, userId) : '',
                milestoneFull: taskData.milestoneFull ? decryptContent(taskData.milestoneFull, userId) : '',
            } as Task);
        });
        callback(tasks);
    }, (error) => {
        console.error("Error fetching tasks:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch tasks. Please check your connection and security rules."
        })
    });
};

export const getTaskProgress = (userId: string, callback: (progress: TaskProgressLog[]) => void) => {
    const q = query(collection(db, "users", userId, "taskProgress"));
    return onSnapshot(q, (querySnapshot) => {
        const progressLogs: TaskProgressLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            progressLogs.push({
                id: doc.id,
                taskId: data.taskId,
                date: data.date,
                progress: data.progress,
            } as TaskProgressLog);
        });
        callback(progressLogs);
    }, (error) => {
        console.error("Error fetching task progress:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch progress. Please check your connection and security rules."
        })
    });
};

export const setTaskProgress = async (userId: string, date: string, taskId: string, progress: TaskProgress) => {
    try {
        const progressId = `${date}_${taskId}`;
        const progressRef = doc(db, "users", userId, "taskProgress", progressId);
        await setDoc(progressRef, { userId, date, taskId, progress }, { merge: true });
    } catch (error) {
        console.error("Error setting task progress:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not save your progress.',
        });
    }
};


export { app, auth, db };
