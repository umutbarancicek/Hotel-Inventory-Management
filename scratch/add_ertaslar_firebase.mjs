import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1Iv_1fkFSVI-P4Y_g1QlCgB4CMsRZJFI",
  authDomain: "miramor-inventory-management.firebaseapp.com",
  projectId: "miramor-inventory-management",
  storageBucket: "miramor-inventory-management.firebasestorage.app",
  messagingSenderId: "539349013423",
  appId: "1:539349013423:web:53cb425931b51b1530d55a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addErtaslar() {
  try {
    const docRef = doc(db, 'storage', 'appData');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error('Firebase document does not exist!');
      process.exit(1);
    }
    
    const data = docSnap.data();
    console.log('Current accounts:', data.accounts.map(a => a.name).join(', '));
    
    const exists = data.accounts.find(a => a.name.trim() === 'ERTAŞLAR');
    if (exists) {
      console.log('ERTAŞLAR already exists in Firebase!');
      process.exit(0);
    }
    
    // Add ERTAŞLAR after METİN DALKIRAN
    const metin = data.accounts.findIndex(a => a.name.trim() === 'METİN DALKIRAN');
    if (metin !== -1) {
      data.accounts.splice(metin + 1, 0, { type: 'supplier', name: 'ERTAŞLAR' });
    } else {
      const firstHotel = data.accounts.findIndex(a => a.type === 'hotel');
      data.accounts.splice(firstHotel !== -1 ? firstHotel : data.accounts.length, 0, { type: 'supplier', name: 'ERTAŞLAR' });
    }
    
    await setDoc(docRef, data);
    console.log('✅ ERTAŞLAR successfully added to Firebase!');
    console.log('New accounts:', data.accounts.map(a => `${a.type}: ${a.name}`).join('\n'));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addErtaslar();
