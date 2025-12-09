// src/utils/helpers.js - 优化的三层风险计算系统
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0); // 归零时间，只比较日期

export const daysDiff = (d1, d2) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  return Math.round((date1 - date2) / 86400000);
};

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

// ✅ 风险优先级（数字越大越严重）
export const RISK_PRIORITY = {
  ongoing: 1,    // 正常
  pending: 2,    // 待计划
  warning: 3,    // 预警
  urgent: 4,     // 紧急
  overdue: 5     // 逾期（最高优先级）
};

// ✅ 取最高风险等级
export const highestRisk = (risks) => {
  if (!risks || risks.length === 0) return 'ongoing';
  return risks.reduce((h, r) => 
    (RISK_PRIORITY[r] || 0) > (RISK_PRIORITY[h] || 0) ? r : h, 
    'ongoing'
  );
};

/**
 * ✅ 三层风险计算系统
 * 
 * 层级1：物料风险计算
 * 层级2：产品风险计算（聚合物料）
 * 层级3：订单风险计算（聚合产品 + 交期）
 */

/**
 * 层级1：计算物料风险
 * @param {Object} material - 物料信息 {code, inv, transit, safe}
 * @param {Number} demand - 需求数量
 * @param {String} deliveryDate - 交付日期
 * @param {Array} purchaseOrders - 该物料的采购订单列表
 * @param {Object} supplier - 主供应商信息 {onTime}
 * @returns {Object} 物料风险信息
 */
export const calculateMaterialRisk = (material, demand, deliveryDate, purchaseOrders = [], supplier = null) => {
  if (!material) return { level: 'ongoing', score: 0 };
  
  const currentStock = material.inv || 0;
  const inTransit = material.transit || 0;
  const safeStock = material.safe || 100;
  const available = currentStock + inTransit;
  const gap = Math.max(0, demand - available);
  const gapRate = demand > 0 ? gap / demand : 0;
  
  // 距离交付日期的天数
  const daysLeft = daysDiff(deliveryDate, TODAY);
  
  // 检查采购订单是否延迟
  let hasDelayedPO = false;
  let maxDelay = 0;
  
  if (purchaseOrders && purchaseOrders.length > 0) {
    purchaseOrders.forEach(po => {
      const poExpectedDate = po.expectedDate || po.date;
      if (poExpectedDate) {
        const poDelay = daysDiff(poExpectedDate, deliveryDate);
        if (poDelay > 0) {
          hasDelayedPO = true;
          maxDelay = Math.max(maxDelay, poDelay);
        }
      }
    });
  }
  
  // 采购覆盖率
  const poTotalQty = (purchaseOrders || []).reduce((sum, po) => sum + (po.qty || 0), 0);
  const poCoverage = gap > 0 ? Math.min(1, poTotalQty / gap) : 1;
  
  // 供应商准时率
  const onTimeRate = supplier?.onTime || 1;
  
  // 风险评分（0-100）
  let score = 0;
  
  // 1. 采购延迟 - 最高优先级
  if (hasDelayedPO && gap > 0) {
    score += Math.min(40, maxDelay * 5); // 延迟1天 = 5分
  }
  
  // 2. 库存缺口
  score += Math.min(30, gapRate * 30); // 缺口比例
  
  // 3. 时间紧迫性
  if (daysLeft < 0) {
    // 已经过了交付日期
    score += 50;
  } else if (daysLeft < 7 && gap > 0) {
    score += 20;
  } else if (daysLeft < 14 && gap > 0) {
    score += 10;
  }
  
  // 4. 采购覆盖不足
  if (gap > 0) {
    if (inTransit === 0) {
      score += 25; // 没有在途采购
    } else if (poCoverage < 0.5) {
      score += 15; // 采购覆盖不足50%
    } else if (poCoverage < 1) {
      score += 8; // 采购覆盖不足100%
    }
  }
  
  // 5. 库存低于安全库存
  if (currentStock < safeStock) {
    score += 10;
  }
  
  // 6. 供应商风险
  if (onTimeRate < 0.85) {
    score += 10;
  }
  
  // 根据分数确定风险等级
  let level = 'ongoing';
  
  if (daysLeft < 0 && gap > 0) {
    // 已过交付日期且库存不足 → 逾期
    level = 'overdue';
  } else if (hasDelayedPO && gap > 0) {
    // 采购延迟且库存不足 → 逾期
    level = 'overdue';
  } else if (inTransit === 0 && gap > 0 && daysLeft < 30) {
    // 没有在途采购，有缺口，时间紧迫 → 待计划
    level = 'pending';
  } else if (score >= 60) {
    level = 'urgent';
  } else if (score >= 30) {
    level = 'warning';
  } else {
    level = 'ongoing';
  }
  
  return {
    materialCode: material.code,
    materialName: material.name,
    demand: Math.round(demand),
    currentStock,
    inTransit,
    available,
    gap,
    gapRate: Math.round(gapRate * 100),
    daysLeft,
    hasDelayedPO,
    maxDelay,
    poCoverage: Math.round(poCoverage * 100),
    onTimeRate: Math.round(onTimeRate * 100),
    score: Math.round(score),
    level
  };
};

/**
 * 层级2：计算产品风险（聚合BOM物料风险）
 * @param {Array} bomMaterialRisks - BOM中所有物料的风险数组
 * @param {Number} productStock - 产品库存
 * @param {Number} productDemand - 产品需求
 * @returns {Object} 产品风险
 */
export const calculateProductRisk = (bomMaterialRisks, productStock = 0, productDemand = 0) => {
  if (!bomMaterialRisks || bomMaterialRisks.length === 0) {
    // 没有BOM，直接看产品库存
    if (productStock >= productDemand) {
      return { level: 'ongoing', score: 0, reason: '产品库存充足' };
    } else {
      return { level: 'warning', score: 30, reason: '产品库存不足' };
    }
  }
  
  // 聚合所有物料风险
  const materialLevels = bomMaterialRisks.map(r => r.level);
  const highestLevel = highestRisk(materialLevels);
  const totalScore = bomMaterialRisks.reduce((sum, r) => sum + (r.score || 0), 0) / bomMaterialRisks.length;
  
  // 检查是否所有物料都正常
  const allNormal = materialLevels.every(l => l === 'ongoing');
  const hasOverdue = materialLevels.some(l => l === 'overdue');
  const hasUrgent = materialLevels.some(l => l === 'urgent');
  const hasPending = materialLevels.some(l => l === 'pending');
  
  let reason = '';
  if (hasOverdue) reason = '存在延迟物料';
  else if (hasUrgent) reason = '存在紧急缺料';
  else if (hasPending) reason = '存在待采购物料';
  else if (allNormal) reason = '物料供应正常';
  else reason = '部分物料需关注';
  
  return {
    level: highestLevel,
    score: Math.round(totalScore),
    reason,
    materialCount: bomMaterialRisks.length,
    normalCount: materialLevels.filter(l => l === 'ongoing').length,
    riskCount: materialLevels.filter(l => l !== 'ongoing').length
  };
};

/**
 * 层级3：计算订单风险（聚合产品风险 + 交期）
 * @param {Array} productRisks - 订单中所有产品的风险数组
 * @param {String} deliveryDate - 订单交付日期
 * @param {String} orderStatus - 订单状态
 * @returns {Object} 订单风险
 */
export const calculateOrderRisk = (productRisks, deliveryDate, orderStatus = 'pending') => {
  if (!productRisks || productRisks.length === 0) {
    return { level: 'ongoing', score: 0, reason: '无产品' };
  }
  
  const daysLeft = daysDiff(deliveryDate, TODAY);
  
  // 如果订单已完成或取消，不计算风险
  if (orderStatus === 'completed' || orderStatus === 'cancelled') {
    return { level: 'ongoing', score: 0, reason: '订单已完成' };
  }
  
  // 如果当前日期已过交付日期且订单未完成 → 订单本身逾期
  if (daysLeft < 0) {
    return {
      level: 'overdue',
      score: 100,
      reason: `订单已逾期 ${Math.abs(daysLeft)} 天`,
      daysOverdue: Math.abs(daysLeft)
    };
  }
  
  // 聚合产品风险
  const productLevels = productRisks.map(r => r.level);
  const highestLevel = highestRisk(productLevels);
  const avgScore = productRisks.reduce((sum, r) => sum + (r.score || 0), 0) / productRisks.length;
  
  // 交期紧迫性加成
  let deliveryBonus = 0;
  if (daysLeft < 7 && highestLevel !== 'ongoing') {
    deliveryBonus = 20; // 7天内交付且有风险
  } else if (daysLeft < 14 && highestLevel !== 'ongoing') {
    deliveryBonus = 10; // 14天内交付且有风险
  }
  
  const finalScore = Math.min(100, avgScore + deliveryBonus);
  
  let reason = '';
  const riskCount = productLevels.filter(l => l !== 'ongoing').length;
  
  if (highestLevel === 'overdue') reason = `${riskCount}个产品供应延迟`;
  else if (highestLevel === 'urgent') reason = `${riskCount}个产品物料紧急`;
  else if (highestLevel === 'pending') reason = `${riskCount}个产品待采购`;
  else if (highestLevel === 'warning') reason = `${riskCount}个产品需关注`;
  else reason = '所有产品正常';
  
  return {
    level: highestLevel,
    score: Math.round(finalScore),
    reason,
    daysLeft,
    productCount: productRisks.length,
    normalCount: productLevels.filter(l => l === 'ongoing').length,
    riskCount
  };
};

/**
 * 旧版风险计算器（兼容性保留，但使用新逻辑）
 */
export const createRiskCalculator = (mats, pos, suppliers) => {
  const matMap = Object.fromEntries(mats.map(m => [m.code, m]));
  const poByMat = pos.reduce((a, p) => { 
    const matCode = p.mat || p.materialCode;
    if (matCode) {
      (a[matCode] = a[matCode] || []).push(p); 
    }
    return a; 
  }, {});
  const supplierByMat = suppliers.reduce((a, s) => { 
    (a[s.mat] = a[s.mat] || []).push(s); 
    return a; 
  }, {});

  return function calcRisk(matCode, demand, deliveryDate) {
    const material = matMap[matCode];
    if (!material) return null;
    
    const matPOs = poByMat[matCode] || [];
    const mainSupplier = (supplierByMat[matCode] || []).find(s => s.main);
    
    // ✅ 使用新的物料风险计算
    const risk = calculateMaterialRisk(material, demand, deliveryDate, matPOs, mainSupplier);
    
    return {
      ...material,
      ...risk,
      // 兼容旧字段
      available: risk.available,
      gap: risk.gap,
      delay: risk.hasDelayedPO ? risk.maxDelay : 0,
      singleSource: material.suppliers === 1,
      onTime: mainSupplier?.onTime || 0
    };
  };
};