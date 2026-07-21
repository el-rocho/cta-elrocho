import type { HealthCategoryInfo, HealthSeverity } from '../types/bloodPressure';

export const HEALTH_CATEGORIES: Record<HealthSeverity, HealthCategoryInfo> = {
  optimal: {
    key: 'optimal',
    name: 'Óptima',
    description: 'Sistólica < 120 y Diastólica < 80 mmHg',
    colorHex: '#10b981', // Verde esmeralda
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#059669',
  },
  normal: {
    key: 'normal',
    name: 'Normal',
    description: 'Sistólica 120-129 y/o Diastólica 80-84 mmHg',
    colorHex: '#3b82f6', // Azul claro
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#2563eb',
  },
  elevated: {
    key: 'elevated',
    name: 'Normal - Alta',
    description: 'Sistólica 130-139 y/o Diastólica 85-89 mmHg',
    colorHex: '#f59e0b', // Ámbar / Amarillo
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#d97706',
  },
  stage1: {
    key: 'stage1',
    name: 'Hipertensión Grado 1',
    description: 'Sistólica 140-159 y/o Diastólica 90-99 mmHg',
    colorHex: '#f97316', // Naranja
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeText: '#ea580c',
  },
  stage2: {
    key: 'stage2',
    name: 'Hipertensión Grado 2',
    description: 'Sistólica 160-179 y/o Diastólica 100-109 mmHg',
    colorHex: '#ef4444', // Rojo
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeText: '#dc2626',
  },
  crisis: {
    key: 'crisis',
    name: 'Crisis Hipertensiva',
    description: 'Sistólica ≥ 180 y/o Diastólica ≥ 110 mmHg',
    colorHex: '#991b1b', // Rojo oscuro / Púrpura
    badgeBg: 'rgba(153, 27, 27, 0.2)',
    badgeText: '#991b1b',
  },
};

/**
 * Clasifica una lectura de tensión arterial según las guías estándar OMS/AHA/ESH.
 */
export function getHealthCategory(systolic: number, diastolic: number): HealthCategoryInfo {
  if (systolic >= 180 || diastolic >= 110) {
    return HEALTH_CATEGORIES.crisis;
  }
  if ((systolic >= 160 && systolic < 180) || (diastolic >= 100 && diastolic < 110)) {
    return HEALTH_CATEGORIES.stage2;
  }
  if ((systolic >= 140 && systolic < 160) || (diastolic >= 90 && diastolic < 100)) {
    return HEALTH_CATEGORIES.stage1;
  }
  if ((systolic >= 130 && systolic < 140) || (diastolic >= 85 && diastolic < 90)) {
    return HEALTH_CATEGORIES.elevated;
  }
  if ((systolic >= 120 && systolic < 130) || (diastolic >= 80 && diastolic < 85)) {
    return HEALTH_CATEGORIES.normal;
  }
  return HEALTH_CATEGORIES.optimal;
}
