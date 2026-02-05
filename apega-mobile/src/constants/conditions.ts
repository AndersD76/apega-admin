// Largô - Sistema de Condições do Produto

export interface Condition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  shortDesc: string;
}

export const CONDITIONS: Condition[] = [
  {
    id: 'novo_etiqueta',
    name: 'Novo com etiqueta',
    emoji: '🏷️',
    description: 'Nunca usado, com etiqueta original',
    shortDesc: 'Com etiqueta',
  },
  {
    id: 'seminovo',
    name: 'Seminovo',
    emoji: '✨',
    description: 'Usado 1-2 vezes, excelente estado',
    shortDesc: 'Usado 1-2x',
  },
  {
    id: 'bom_estado',
    name: 'Bom estado',
    emoji: '👍',
    description: 'Bem conservado, pequenos sinais de uso',
    shortDesc: 'Bem conservado',
  },
  {
    id: 'usado',
    name: 'Usado',
    emoji: '🔄',
    description: 'Com sinais visíveis de uso',
    shortDesc: 'Sinais de uso',
  },
];

/**
 * Retorna a condição pelo ID
 */
export function getConditionById(id: string): Condition | undefined {
  return CONDITIONS.find(c => c.id === id);
}

/**
 * Retorna o nome formatado com emoji
 */
export function getConditionLabel(id: string): string {
  const condition = getConditionById(id);
  if (!condition) return id;
  return `${condition.emoji} ${condition.name}`;
}

/**
 * Retorna apenas o emoji da condição
 */
export function getConditionEmoji(id: string): string {
  const condition = getConditionById(id);
  return condition?.emoji || '📦';
}

/**
 * Mapeia condições antigas para novas (compatibilidade)
 */
export function mapLegacyCondition(oldCondition: string): string {
  const mapping: Record<string, string> = {
    'novo': 'novo_etiqueta',
    'seminovo': 'seminovo',
    'usado': 'bom_estado',
    'vintage': 'usado',
  };
  return mapping[oldCondition.toLowerCase()] || oldCondition;
}

export default CONDITIONS;
