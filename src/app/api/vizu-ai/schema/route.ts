import { NextResponse } from 'next/server';

/**
 * GET /api/vizu-ai/schema
 *
 * Retorna o schema JSON completo para validação de apresentações e comandos.
 */
export async function GET() {
  const schema = {
    versao: '1.0',
    slide_width: 960,
    slide_height: 540,
    unidade: 'pixels',

    presentation: {
      id: 'string (UUID v4)',
      title: 'string',
      theme: 'Theme',
      slides: 'Slide[]',
      metadata: {
        author: 'string? (opcional)',
        createdAt: 'string (ISO 8601)',
        updatedAt: 'string (ISO 8601)',
        version: 'string',
        description: 'string? (opcional)',
        tags: 'string[]? (opcional)',
      },
    },

    theme: {
      id: 'string',
      name: 'string',
      colors: {
        primary: 'string (hex)',
        secondary: 'string (hex)',
        accent: 'string (hex)',
        background: 'string (hex)',
        surface: 'string (hex)',
        text: 'string (hex)',
        textSecondary: 'string (hex)',
        border: 'string (hex)',
      },
      fonts: {
        heading: 'string',
        body: 'string',
      },
    },

    slide: {
      id: 'string (UUID v4)',
      layout: 'blank | cover | section | content | comparison | quote | closing',
      background: {
        type: 'color | gradient | image',
        color: 'string (hex) — quando type=color',
        gradient: {
          from: 'string (hex)',
          to: 'string (hex)',
          direction: 'number (graus, 0–360)',
        },
        image: 'string (URL ou data URL) — quando type=image',
        imageOpacity: 'number (0–1) — quando type=image',
      },
      elements: 'SlideElement[]',
      notes: 'string? (opcional)',
    },

    base_element: {
      id: 'string (UUID v4)',
      type: 'text | image | shape | icon | table | line',
      x: 'number (0–960)',
      y: 'number (0–540)',
      width: 'number (min: 8)',
      height: 'number (min: 8)',
      rotation: 'number (graus, default: 0)',
      opacity: 'number (0–1, default: 1)',
      zIndex: 'number (default: 1)',
      locked: 'boolean (default: false)',
      visible: 'boolean (default: true)',
      name: 'string? (opcional)',
    },

    text_element: {
      herda: 'BaseElement',
      type: '"text"',
      content: 'string',
      style: {
        fontFamily: 'string (ex: "Inter")',
        fontSize: 'number (px)',
        fontWeight: 'number (100–900)',
        fontStyle: 'normal | italic',
        textDecoration: 'none | underline | line-through',
        color: 'string (hex)',
        textAlign: 'left | center | right | justify',
        lineHeight: 'number (multiplicador, ex: 1.5)',
        letterSpacing: 'number (px, pode ser negativo)',
        textTransform: 'none | uppercase | lowercase | capitalize',
      },
      background: 'string (hex ou "transparent")',
      border: 'BorderStyle',
      padding: 'number (px)',
      verticalAlign: 'top | middle | bottom',
    },

    shape_element: {
      herda: 'BaseElement',
      type: '"shape"',
      shape: 'rectangle | rounded-rectangle | circle | triangle | diamond | pentagon | hexagon | star | arrow-right | arrow-left',
      fill: 'string (hex)',
      border: 'BorderStyle',
      shadow: 'ShadowStyle',
    },

    icon_element: {
      herda: 'BaseElement',
      type: '"icon"',
      iconName: 'string (ver GET /api/vizu-ai/icones)',
      color: 'string (hex)',
      background: 'string (hex ou "transparent")',
      border: 'BorderStyle',
    },

    image_element: {
      herda: 'BaseElement',
      type: '"image"',
      src: 'string (URL ou data URL base64)',
      alt: 'string',
      objectFit: 'cover | contain | fill',
      border: 'BorderStyle',
      shadow: 'ShadowStyle',
    },

    line_element: {
      herda: 'BaseElement',
      type: '"line"',
      color: 'string (hex)',
      thickness: 'number (px)',
      style: 'solid | dashed | dotted',
      arrowStart: 'boolean',
      arrowEnd: 'boolean',
    },

    border_style: {
      width: 'number (px)',
      color: 'string (hex ou "transparent")',
      style: 'solid | dashed | dotted | none',
      radius: 'number (px)',
    },

    shadow_style: {
      enabled: 'boolean',
      x: 'number (px)',
      y: 'number (px)',
      blur: 'number (px)',
      color: 'string (hex ou rgba)',
    },

    posicoes_semanticas: {
      descricao: 'Atalhos de posicionamento que o endpoint /execute converte para coordenadas em pixels.',
      valores: {
        centro:              { x: 280, y: 170, width: 400, height: 200 },
        topo:                { x: 80,  y: 40,  width: 800, height: 80  },
        rodape:              { x: 80,  y: 460, width: 800, height: 60  },
        col_esquerda:        { x: 40,  y: 120, width: 420, height: 360 },
        col_direita:         { x: 500, y: 120, width: 420, height: 360 },
        topo_esquerda:       { x: 40,  y: 40,  width: 400, height: 200 },
        topo_direita:        { x: 520, y: 40,  width: 400, height: 200 },
        canto_inferior_esq:  { x: 40,  y: 380, width: 300, height: 120 },
        canto_inferior_dir:  { x: 620, y: 380, width: 300, height: 120 },
        largura_total:       { x: 0,   y: 120, width: 960, height: 300 },
        area_conteudo:       { x: 80,  y: 120, width: 800, height: 360 },
      },
    },

    margem_segura: {
      descricao: 'Área segura para evitar cortes em projeção.',
      horizontal: 80,
      vertical: 40,
      area_segura: { x: 80, y: 40, width: 800, height: 460 },
    },
  };

  return NextResponse.json(schema);
}
