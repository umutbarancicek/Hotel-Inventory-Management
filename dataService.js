import { INITIAL_DATA } from './initialData.js';

export const DataService = {
  init() {
    if (!localStorage.getItem('otel_app_data_v3')) {
      localStorage.setItem('otel_app_data_v3', JSON.stringify(INITIAL_DATA));
    }
  },
  
  getData() {
    return JSON.parse(localStorage.getItem('otel_app_data_v3'));
  },
  
  saveData(data) {
    localStorage.setItem('otel_app_data_v3', JSON.stringify(data));
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
