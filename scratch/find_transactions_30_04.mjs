import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "mira-envanter",
  apiKey: "fake-key-for-node"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const docSnap = await getDoc(doc(db, 'storage', 'appData'));
  if (docSnap.exists()) {
    const data = docSnap.data();
    const targetTxs = data.transactions.filter(t => t.date === '2026-04-30' && (t.product || '').toUpperCase().includes('DOMATES') && (t.hotel || '').toUpperCase().includes('MİRAMOR'));
    console.log("Found transactions:", JSON.stringify(targetTxs, null, 2));
    
    // Also log the priceList for 2026-04-30
    console.log("Price list for 2026-04-30:", JSON.stringify(data.priceLists ? data.priceLists['2026-04-30'] : null, null, 2));
  } else {
    console.log("No data snap found");
  }
}

run().catch(console.error);
