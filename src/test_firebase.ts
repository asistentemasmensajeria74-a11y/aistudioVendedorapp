import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import * as fs from 'fs';

// Manually parse .env if present
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const parted = line.split('=');
    if (parted.length >= 2) {
      const key = parted[0].trim();
      const val = parted.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('Testing connection with Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWrite() {
  try {
    console.log('Attempting to read collection USUARIOS...');
    const snapshot = await getDocs(collection(db, 'USUARIOS'));
    console.log('Read successful, total documents:', snapshot.size);
    snapshot.forEach(doc => {
      console.log('Doc ID:', doc.id, doc.data());
    });
  } catch (err: any) {
    console.error('Error reading collection:', err.message || err);
  }

  try {
    console.log('Attempting to write a test document...');
    const docRef = await addDoc(collection(db, 'TEST_WRITE'), {
      timestamp: new Date().toISOString(),
      test: true
    });
    console.log('Write successful! Document ID:', docRef.id);
  } catch (err: any) {
    console.error('Error writing document:', err.message || err);
  }
}

testWrite();
