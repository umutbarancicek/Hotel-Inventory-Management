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
        const existingLocalData = localStorage.getItem('otel_app_data_v8');
        if (existingLocalData) {
          localData = JSON.parse(existingLocalData);
        } else {
          localData = INITIAL_DATA;
        }
        await setDoc(docRef, localData);
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

  // Save a full price list snapshot for a given date
  savePriceList(dateStr, prices) {
    const data = this.getData();
    if (!data.priceLists) data.priceLists = {};
    data.priceLists[dateStr] = prices;
    // Also keep a flat prices[] for backward compat (used by quick-entry form)
    data.prices = prices;
    this.saveData(data);
  },

  // Return the latest price list as a flat array (for forms/dropdowns)
  getLatestPrices() {
    const data = this.getData();
    if (data.priceLists) {
      const dates = Object.keys(data.priceLists).sort((a,b) => b.localeCompare(a));
      if (dates.length > 0) return data.priceLists[dates[0]];
    }
    return data.prices || [];
  },
  
  getAccountBalances(dateFrom, dateTo) {
    const data = this.getData();
    const balances = {};
    
    data.accounts.forEach(acc => {
      balances[acc.name] = { name: acc.name, type: acc.type, totalBought: 0, totalPaid: 0, balance: 0, lastTxDate: null };
    });
    
    // Filter transactions by date range if provided
    const txs = data.transactions.filter(tx => {
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      return true;
    });

    txs.forEach(tx => {
      const supplyTotal = tx.qty * tx.supplyPrice;
      const halTotal = tx.qty * tx.buyPrice;
      if (balances[tx.supplier]) {
        balances[tx.supplier].totalBought += halTotal;
        if (!balances[tx.supplier].lastTxDate || balances[tx.supplier].lastTxDate < tx.date) {
          balances[tx.supplier].lastTxDate = tx.date;
        }
      }
      if (balances[tx.hotel]) {
        balances[tx.hotel].totalBought += supplyTotal;
        if (!balances[tx.hotel].lastTxDate || balances[tx.hotel].lastTxDate < tx.date) {
          balances[tx.hotel].lastTxDate = tx.date;
        }
      }
    });
    
    // Filter payments by date range if provided
    const pays = data.payments.filter(p => {
      if (dateFrom && p.date < dateFrom) return false;
      if (dateTo && p.date > dateTo) return false;
      return true;
    });

    pays.forEach(p => {
      if (balances[p.account]) {
        balances[p.account].totalPaid += Number(p.amount);
        if (!balances[p.account].lastTxDate || balances[p.account].lastTxDate < p.date) {
          balances[p.account].lastTxDate = p.date;
        }
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
  },

  updateTransaction(id, fields) {
    const data = this.getData();
    const idx = data.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      data.transactions[idx] = { ...data.transactions[idx], ...fields };
      this.saveData(data);
      return true;
    }
    return false;
  },

  deleteTransaction(id) {
    const data = this.getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    this.saveData(data);
  },

  updatePayment(id, fields) {
    const data = this.getData();
    const idx = data.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      data.payments[idx] = { ...data.payments[idx], ...fields };
      this.saveData(data);
      return true;
    }
    return false;
  },

  deletePayment(id) {
    const data = this.getData();
    data.payments = data.payments.filter(p => p.id !== id);
    this.saveData(data);
  }
};
