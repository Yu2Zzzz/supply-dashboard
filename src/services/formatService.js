// src/services/formatService.js
export const formatService = {
  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
  },
  
  formatCurrency(amount, currency = '楼') {
    if (amount === null || amount === undefined) return '';
    return ``;
  },
  
  formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '';
    return Number(num).toFixed(decimals);
  },
};

export default formatService;
