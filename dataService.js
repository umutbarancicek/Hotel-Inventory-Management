import { INITIAL_DATA } from './initialData.js';
import { db } from './firebaseConfig.js';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

let localData = null;

export const DataService = {
  cleanData(data) {
    let changed = false;

    // Only initialize accounts if completely missing
    if (!data.accounts || data.accounts.length === 0) {
      data.accounts = JSON.parse(JSON.stringify(INITIAL_DATA.accounts || []));
      changed = true;
    }

    // Trim transactions
    if (data.transactions) {
      data.transactions.forEach(t => {
        if (t.supplier && t.supplier !== t.supplier.trim()) { t.supplier = t.supplier.trim(); changed = true; }
        if (t.hotel && t.hotel !== t.hotel.trim()) { t.hotel = t.hotel.trim(); changed = true; }
        if (t.product && t.product !== t.product.trim()) { t.product = t.product.trim(); changed = true; }
      });
    }

    // Trim payments
    if (data.payments) {
      data.payments.forEach(p => {
        if (p.account && p.account !== p.account.trim()) { p.account = p.account.trim(); changed = true; }
      });
    }

    // Trim and unique accounts
    if (data.accounts) {
      const uniqueAccs = {};
      const origCount = data.accounts.length;
      data.accounts.forEach(acc => {
        const name = acc.name.trim();
        if (!uniqueAccs[name]) {
          uniqueAccs[name] = { name, type: acc.type };
        }
      });
      data.accounts = Object.values(uniqueAccs);
      if (data.accounts.length !== origCount) changed = true;
    }
    
    return changed;
  },

  async init() {
    try {
      const docRef = doc(db, 'storage', 'appData');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        localData = docSnap.data();
        
        // ── TRANSACTIONS: Load from monthly partitioned collection (single source of truth) ──
        const transactions = [];
        const txSnap = await getDocs(collection(db, 'transactions'));
        txSnap.forEach(d => {
          const docData = d.data();
          if (docData.items && Array.isArray(docData.items)) {
            transactions.push(...docData.items);
          }
        });
        
        if (transactions.length > 0) {
          // Sort chronologically
          transactions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          localData.transactions = transactions;
        } else if (localData.transactions && localData.transactions.length > 0) {
          // One-time migration: appData still has transactions, move them to monthly collection
          console.log('Migrating transactions from appData to monthly collection...');
          await this._saveTransactionsPartitioned(localData.transactions);
        } else {
          localData.transactions = [];
        }
        
        // ── PRICE LISTS: Load from priceLists collection ──
        const priceLists = {};
        const plSnap = await getDocs(collection(db, 'priceLists'));
        plSnap.forEach(d => {
          const docData = d.data();
          const targetDate = d.id;
          
          let list = [];
          if (docData.items && Array.isArray(docData.items)) {
            list = docData.items.map(item => ({
              ...item,
              date: targetDate
            }));
          } else if (docData.prices && typeof docData.prices === 'object') {
            list = Object.keys(docData.prices).map(prod => ({
              product: prod,
              price: docData.prices[prod],
              unit: 'Kg',
              date: targetDate
            }));
          }
          priceLists[targetDate] = list;
        });
        localData.priceLists = priceLists;

        // Only save non-transaction data (accounts, payments, etc.) if needed
        if (this.cleanData(localData)) {
          await this.saveData(localData);
        }
      } else {
        localData = { ...(INITIAL_DATA || {}), transactions: [], accounts: [], payments: [] };
        this.cleanData(localData);
        await this.saveData(localData);
      }
    } catch (error) {
      console.error("Firebase connection error:", error);
      alert("Bulut sistemine bağlanılamadı. Veriler geçici olarak cihaza kaydediliyor.");
      if (!localStorage.getItem('otel_app_data_v8')) {
        localStorage.setItem('otel_app_data_v8', JSON.stringify(INITIAL_DATA));
      }
      localData = JSON.parse(localStorage.getItem('otel_app_data_v8'));
      if (this.cleanData(localData)) {
        localStorage.setItem('otel_app_data_v8', JSON.stringify(localData));
      }
    }
  },

  // Internal helper: partition and write transactions to monthly Firestore documents
  async _saveTransactionsPartitioned(txList) {
    const partitions = {};
    (txList || []).forEach(tx => {
      const dateStr = tx.date || '';
      let yearMonth = 'unknown';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        yearMonth = dateStr.slice(0, 7);
      }
      if (!partitions[yearMonth]) partitions[yearMonth] = [];
      partitions[yearMonth].push(tx);
    });
    for (const [ym, items] of Object.entries(partitions)) {
      const monthlyRef = doc(db, 'transactions', ym);
      await setDoc(monthlyRef, { items });
    }
  },

  getData() {
    return localData || INITIAL_DATA;
  },
  
  async saveData(data) {
    localData = data;
    try {
      const docRef = doc(db, 'storage', 'appData');
      // Save only metadata (accounts, payments, etc.) — never transactions or priceLists
      const { priceLists, transactions, ...appDataToSave } = data;
      await setDoc(docRef, appDataToSave);

      // Save transactions to monthly partitioned collection
      await this._saveTransactionsPartitioned(transactions);
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
  async savePriceList(dateStr, prices) {
    const data = this.getData();
    if (!data.priceLists) data.priceLists = {};
    data.priceLists[dateStr] = prices;
    // Also keep a flat prices[] for backward compat (used by quick-entry form)
    data.prices = prices;

    // Save to Firestore collection
    try {
      const plistDocRef = doc(db, 'priceLists', dateStr);
      await setDoc(plistDocRef, {
        items: prices,
        date: dateStr,
        fetchedAt: new Date().toISOString(),
        source: 'user'
      });
    } catch (e) {
      console.error("Error saving price list to collection:", e);
    }

    await this.saveData(data);
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
