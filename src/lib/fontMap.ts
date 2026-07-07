// Mapa de fontes Vizu → PowerPoint (docs/PPTX-SPEC.md §4.7).
// O seletor de fontes da UI é restrito a estas chaves para garantir que o
// export .pptx nunca dependa de uma fonte sem fallback razoável no Office.
export const PPTX_FONT_MAP: Record<string, { fontFace: string; fallback: string }> = {
  Inter: { fontFace: 'Inter', fallback: 'Calibri' },
  Archivo: { fontFace: 'Archivo', fallback: 'Arial' },
  'Archivo Narrow': { fontFace: 'Archivo Narrow', fallback: 'Arial Narrow' },
  Georgia: { fontFace: 'Georgia', fallback: 'Georgia' },
  Arial: { fontFace: 'Arial', fallback: 'Arial' },
  Verdana: { fontFace: 'Verdana', fallback: 'Verdana' },
  'Courier New': { fontFace: 'Courier New', fallback: 'Courier New' },
  'Times New Roman': { fontFace: 'Times New Roman', fallback: 'Times New Roman' },
  'Trebuchet MS': { fontFace: 'Trebuchet MS', fallback: 'Trebuchet MS' },
};

export const PPTX_SAFE_FONTS = Object.keys(PPTX_FONT_MAP);

export function toPptxFontFace(vizuFont: string): string {
  return PPTX_FONT_MAP[vizuFont]?.fontFace ?? vizuFont;
}
