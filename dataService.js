import { INITIAL_DATA } from './initialData.js';
import { db } from './firebaseConfig.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let localData = null;

export const DataService = {
  async init() {
    try {
      const docRef = doc(db, 'storage', 'appData');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        localData = docSnap.data();
      } else {
        localData = INITIAL_DATA;
        await setDoc(docRef, INITIAL_DATA);
      }
    } catch (error) {
      console.error("Firebase connection error:", error);
      alert("Bulut sistemine bağlanılamadı. Veriler geçici olarak cihaza kaydediliyor.");
      if (!localStorage.getItem('otel_app_data_v8')) {
        localStorage.setItem('otel_app_data_v8', JSON.stringify(INITIAL_DATA));
      }
      localData = JSON.parse(localStorage.getItem('otel_app_data_v8'));
    }
  },
  
  getData() {
    return localData || INITIAL_DATA;
  },
  
  async saveData(data) {
    localData = data;
    try {
      const docRef = doc(db, 'storage', 'appData');
      await setDoc(docRef, data);
    } catch (error) {
      console.error("Firebase save error:", error);
      localStorage.setItem('otel_app_data_v8', JSON.stringify(data));
    }
  },
  
  addTransaction(tx) {
    const data = this.getData();
    tx.id = Date.now();
    data.transactions.push(tx);
    this.saveData(data);
  },
  
  addPayment(payment) {
    const data = this.getData();
    payment.id = Date.now();
    data.payments.push(payment);
    this.saveData(data);
  },
  
  getAccountBalances() {
    const data = this.getData();
    const balances = {};
    
    data.accounts.forEach(acc => {
      balances[acc.name] = { name: acc.name, type: acc.type, totalBought: 0, totalPaid: 0, balance: 0 };
    });
    
    // Calculate from transactions
    data.transactions.forEach(tx => {
      const supplyTotal = tx.qty * tx.supplyPrice; // Otel'e satış tutarı
      const halTotal = tx.qty * tx.buyPrice; // Hal'den alış tutarı
      
      // Supplier (Müstahsil) balance (We buy from them)
      if (balances[tx.supplier]) {
        balances[tx.supplier].totalBought += halTotal;
      }
      
      // Hotel balance (We sell to them)
      if (balances[tx.hotel]) {
        balances[tx.hotel].totalBought += supplyTotal;
      }
    });
    
    // Calculate from payments
    data.payments.forEach(p => {
      if (balances[p.account]) {
        // If we pay supplier, it decreases our debt. 
        // For simplicity: balance = totalBought - totalPaid
        balances[p.account].totalPaid += Number(p.amount);
      }
    });
    
    Object.keys(balances).forEach(key => {
      balances[key].balance = balances[key].totalBought - balances[key].totalPaid;
    });
    
    return Object.values(balances);
  },
  
  getDashboardStats() {
    const data = this.getData();
    let totalHal = 0;
    let totalSupply = 0;
    let totalQty = 0;
    
    data.transactions.forEach(tx => {
      totalQty += Number(tx.qty);
      totalHal += (tx.qty * tx.buyPrice);
      totalSupply += (tx.qty * tx.supplyPrice);
    });
    
    const profit = totalSupply - totalHal;
    
    return {
      totalQty,
      totalHal,
      totalSupply,
      profit
    };
  }
};
