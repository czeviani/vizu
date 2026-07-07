import { z } from 'zod';

// Layouts que a IA pode gerar (exclui 'blank', que só existe para slides manuais em branco).
export const AI_LAYOUTS = ['cover', 'section', 'content', 'comparison', 'quote', 'closing'] as const;

export const aiSlideSpecSchema = z.object({
  layout: z.enum(AI_LAYOUTS),
  data: z
    .object({
      title: z.string().max(120).optional(),
      subtitle: z.string().max(160).optional(),
      content: z.string().max(600).optional(),
      bullets: z.array(z.string().max(140)).max(6).optional(),
      author: z.string().max(80).optional(),
      date: z.string().max(40).optional(),
      leftTitle: z.string().max(80).optional(),
      leftContent: z.string().max(500).optional(),
      rightTitle: z.string().max(80).optional(),
      rightContent: z.string().max(500).optional(),
      quote: z.string().max(400).optional(),
      attribution: z.string().max(80).optional(),
      columns: z
        .array(
          z.object({
            heading: z.string().max(60),
            rows: z.array(z.string().max(80)).max(6),
          })
        )
        .max(4)
        .optional(),
    })
    .strict(),
});

export const generateSlidesResponseSchema = z.object({
  slides: z.array(aiSlideSpecSchema).min(1).max(24),
});

export type GeneratedSlideSpec = z.infer<typeof aiSlideSpecSchema>;
