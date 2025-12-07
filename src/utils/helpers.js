// src/utils/helpers.js
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const TODAY = new Date();

export const daysDiff = (d1, d2) => Math.round((new Date(d1) - new Date(d2)) / 86400000);

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN');
};

export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

export const highestRisk = (risks) => {
  const RISK_PRIORITY = {
    ongoing: 1,
    warning: 2,
    urgent: 3,
    overdue: 4,
    pending: 5
  };
  return risks.reduce((h, r) => (RISK_PRIORITY[r] || 0) > (RISK_PRIORITY[h] || 0) ? r : h, 'ongoing');
};

export const createRiskCalculator = (mats, pos, suppliers) => {
  const matMap = Object.fromEntries(mats.map(m => [m.code, m]));
  const poByMat = pos.reduce((a, p) => { (a[p.mat] = a[p.mat] || []).push(p); return a; }, {});
  const supplierByMat = suppliers.reduce((a, s) => { (a[s.mat] = a[s.mat] || []).push(s); return a; }, {});

  return function calcRisk(matCode, demand, deliveryDate) {
    const m = matMap[matCode];
    if (!m) return null;
    
    const available = m.inv + m.transit;
    const gap = Math.max(0, demand - available);
    const gapRate = demand > 0 ? gap / demand : 0;
    const daysLeft = daysDiff(deliveryDate, TODAY);
    const matPOs = poByMat[matCode] || [];
    const latestPO = matPOs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const delay = latestPO ? daysDiff(latestPO.date, deliveryDate) : null;
    const poCoverage = gap > 0 ? Math.min(1, matPOs.reduce((s, p) => s + p.qty, 0) / gap) : 1;
    const mainSupplier = (supplierByMat[matCode] || []).find(s => s.main);
    const singleSource = m.suppliers === 1;
    
    let score = 0;
    if (delay > 0) score += Math.min(30, delay * 3);
    else if (daysLeft < 7 && gap > 0) score += 20;
    else if (daysLeft < 14 && gap > 0) score += 10;
    score += Math.min(30, gapRate * 30);
    if (m.transit === 0 && gap > 0) score += 20;
    else if (poCoverage < 0.5) score += 15;
    else if (poCoverage < 1) score += 8;
    if (singleSource) score += 5;
    if (mainSupplier?.onTime < 0.85) score += 5;
    if (m.inv < m.safe) score += 10;

    let level = 'ongoing';
    if (m.transit === 0 && gap > 0) level = 'pending';
    else if (delay > 0) level = 'overdue';
    else if (score >= 50) level = 'urgent';
    else if (score >= 25) level = 'warning';

    return { 
      ...m, 
      demand: Math.round(demand), 
      available, 
      gap, 
      gapRate, 
      daysLeft, 
      delay, 
      poCoverage, 
      singleSource, 
      onTime: mainSupplier?.onTime || 0, 
      score: Math.round(score), 
      level 
    };
  };
};