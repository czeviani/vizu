import type { SlideElement } from '@/types/slide';

/**
 * zIndex do próximo elemento a inserir. Antes, todo elemento novo nascia com
 * zIndex fixo (10), então um segundo elemento na mesma posição padrão ficava
 * empatado em zIndex com o primeiro — o mais recente cobria o mais antigo por
 * ordem de array, dando a impressão de que o elemento anterior "sumiu".
 */
export function nextZIndex(elements: SlideElement[]): number {
  return elements.length === 0 ? 1 : Math.max(...elements.map((e) => e.zIndex)) + 1;
}

/**
 * Pequeno deslocamento em cascata (estilo PowerPoint) para que elementos
 * inseridos repetidamente na posição padrão não fiquem exatamente sobrepostos.
 */
export function cascadeOffset(elements: SlideElement[]): number {
  return (elements.length % 6) * 18;
}
