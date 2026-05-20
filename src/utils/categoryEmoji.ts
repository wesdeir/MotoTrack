import type { MaintenanceCategory } from '../models';

/**
 * Shared emoji map for maintenance categories.
 * Single source of truth — imported by MaintenanceItem, ReminderCard, TimelineView.
 */
export const CATEGORY_EMOJI: Record<MaintenanceCategory, string> = {
  'oil-change': '🔧',
  brakes: '🛑',
  'wheel-bearing': '⚙️',
  tires: '🔄',
  coolant: '🌡️',
  'transmission-fluid': '🔩',
  'brake-fluid': '💧',
  'power-steering-fluid': '💧',
  'spark-plugs': '⚡',
  filter: '🫙',
  inspection: '🔍',
  other: '🔩',
};
