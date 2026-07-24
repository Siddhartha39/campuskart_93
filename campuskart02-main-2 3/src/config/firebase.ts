import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD4drIfS7-leuuq4w3O3BP4kWYwVoW1fYs",
  authDomain: "campuskart-67561.firebaseapp.com",
  projectId: "campuskart-67561",
  storageBucket: "campuskart-67561.firebasestorage.app",
  messagingSenderId: "908567083976",
  appId: "1:908567083976:web:4311d8f67df8dda1dadefd",
  measurementId: "G-EBLQLKSRZ4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export const uploadFirebaseFile = async (filePath: string, file: File | Blob): Promise<string> => {
  const storageReference = storageRef(storage, filePath);
  await uploadBytes(storageReference, file);
  return getDownloadURL(storageReference);
};

export default app;
