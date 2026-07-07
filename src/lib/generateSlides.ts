import Anthropic from '@anthropic-ai/sdk';
import type { AISlideSpec } from '@/types/slide';
import { generateSlidesResponseSchema } from './aiSlideSpecSchema';

export type PresentationType = 'relatorio' | 'pitch' | 'treinamento' | 'outro';

export interface GenerateOptions {
  title: string;
  presentationType: PresentationType;
  slideCountHint: number;
}

const PRESENTATION_TYPE_LABEL: Record<PresentationType, string> = {
  relatorio: 'Relatório executivo',
  pitch: 'Pitch',
  treinamento: 'Treinamento',
  outro: 'Apresentação',
};

const RETURN_SLIDES_TOOL: Anthropic.Tool = {
  name: 'return_slides',
  description:
    'Retorna a lista de slides estruturados da apresentação, no schema semântico da Vizu. NUNCA inclua posições x/y, tamanhos ou coordenadas — apenas conteúdo e o layout escolhido. O motor de composição da Vizu calcula o layout visual a partir desses dados.',
  input_schema: {
    type: 'object',
    properties: {
      slides: {
        type: 'array',
        minItems: 3,
        maxItems: 24,
        items: {
          type: 'object',
          properties: {
            layout: {
              type: 'string',
              enum: ['cover', 'section', 'content', 'comparison', 'quote', 'closing'],
              description:
                'cover: capa (título+subtítulo+autor). section: divisor de seção (título curto). content: título+bullets (máx 5, ~90 caracteres cada) OU título+parágrafo curto. comparison: dois blocos lado a lado (leftTitle/leftContent vs rightTitle/rightContent). quote: citação em destaque. closing: encerramento (título+subtítulo, ex. "Obrigado"/"Perguntas?").',
            },
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                subtitle: { type: 'string' },
                content: { type: 'string', description: 'Parágrafo curto (até ~400 caracteres), usado quando não há bullets.' },
                bullets: { type: 'array', items: { type: 'string' }, maxItems: 6, description: 'Máximo 5 itens, cada um até ~90 caracteres.' },
                author: { type: 'string' },
                date: { type: 'string' },
                leftTitle: { type: 'string' },
                leftContent: { type: 'string' },
                rightTitle: { type: 'string' },
                rightContent: { type: 'string' },
                quote: { type: 'string' },
                attribution: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          required: ['layout', 'data'],
          additionalProperties: false,
        },
      },
    },
    required: ['slides'],
  },
};

function systemPrompt(opts: GenerateOptions): string {
  return `Você estrutura apresentações de slides a partir de dados fornecidos pelo usuário, para o produto Vizu.

Regras obrigatórias:
- Responda inteiramente em pt-BR.
- Use APENAS os layouts: cover, section, content, comparison, quote, closing.
- NUNCA invente dados/números/fatos que não estejam no texto fornecido pelo usuário — organize e resuma o conteúdo real.
- O primeiro slide deve ser "cover" (capa) com o título "${opts.title}".
- O último slide deve ser "closing" (encerramento).
- Slides "content" têm no máximo 5 bullets, cada bullet com até ~90 caracteres. Se houver mais conteúdo do que cabe em 5 bullets, divida em múltiplos slides "content" (ex. "Tópico (1/2)", "Tópico (2/2)").
- Use slides "section" para separar grandes blocos temáticos quando o conteúdo original tiver múltiplas seções/tópicos distintos.
- Gere aproximadamente ${opts.slideCountHint} slides no total (varie um pouco se o conteúdo pedir, mas não exagere).
- Tipo de apresentação: ${PRESENTATION_TYPE_LABEL[opts.presentationType]}.
- Chame a tool "return_slides" exatamente uma vez com o resultado final. Não inclua posições, coordenadas ou tamanhos — apenas conteúdo semântico.`;
}

export async function aiGenerateSlides(rawText: string, opts: GenerateOptions): Promise<AISlideSpec[]> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 8000,
    system: systemPrompt(opts),
    tools: [RETURN_SLIDES_TOOL],
    tool_choice: { type: 'tool', name: 'return_slides' },
    messages: [
      {
        role: 'user',
        content: `Dados fornecidos pelo usuário para estruturar a apresentação "${opts.title}":\n\n${rawText}`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'return_slides'
  );
  if (!toolUse) {
    throw new Error('Claude não retornou o tool_use esperado (return_slides)');
  }

  const parsed = generateSlidesResponseSchema.parse(toolUse.input);
  return parsed.slides as AISlideSpec[];
}

/* ── Fallback heurístico (sem API key configurada) ────────────────────── */

function splitBulletLine(line: string): string | null {
  const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)$/);
  return m ? m[1].trim() : null;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

interface Section {
  heading: string | null;
  bullets: string[];
  paragraphs: string[];
}

function parseSections(rawText: string): Section[] {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const sections: Section[] = [];
  let current: Section = { heading: null, bullets: [], paragraphs: [] };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      if (current.heading || current.bullets.length || current.paragraphs.length) sections.push(current);
      current = { heading: headingMatch[1].trim(), bullets: [], paragraphs: [] };
      continue;
    }

    const bullet = splitBulletLine(line);
    if (bullet) {
      current.bullets.push(bullet);
      continue;
    }

    current.paragraphs.push(line);
  }
  if (current.heading || current.bullets.length || current.paragraphs.length) sections.push(current);

  if (sections.length === 0) sections.push({ heading: null, bullets: [], paragraphs: [] });
  return sections;
}

export function heuristicGenerateSlides(rawText: string, opts: GenerateOptions): AISlideSpec[] {
  const sections = parseSections(rawText);
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const specs: AISlideSpec[] = [
    {
      layout: 'cover',
      data: {
        title: opts.title,
        subtitle: PRESENTATION_TYPE_LABEL[opts.presentationType],
        date: today,
      },
    },
  ];

  for (const section of sections) {
    let bullets = section.bullets.map((b) => truncate(b, 90));
    if (bullets.length === 0 && section.paragraphs.length > 0) {
      const joined = section.paragraphs.join(' ');
      bullets = joined
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => truncate(s, 90))
        .slice(0, 12);
    }

    if (bullets.length === 0) {
      if (section.heading) {
        specs.push({ layout: 'section', data: { title: section.heading } });
      }
      continue;
    }

    const groups = chunk(bullets, 5);
    groups.forEach((group, i) => {
      const title = section.heading
        ? groups.length > 1
          ? `${section.heading} (${i + 1}/${groups.length})`
          : section.heading
        : opts.title;
      specs.push({ layout: 'content', data: { title, bullets: group } });
    });
  }

  specs.push({
    layout: 'closing',
    data: { title: 'Obrigado', subtitle: 'Perguntas?' },
  });

  return specs;
}
