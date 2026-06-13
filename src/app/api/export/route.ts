import { NextRequest, NextResponse } from 'next/server';
import type { Presentation } from '@/types/slide';
import { exportToPptx } from '@/lib/pptxExport';

/**
 * Export endpoint — generates a .pptx file from a presentation JSON.
 *
 * POST /api/export
 * Body: Presentation JSON
 * Returns: .pptx binary
 */
export async function POST(req: NextRequest) {
  try {
    const presentation = await req.json() as Presentation;
    if (!presentation?.id) {
      return NextResponse.json({ error: 'Invalid presentation data' }, { status: 400 });
    }

    const blob = await exportToPptx(presentation);
    const buffer = await blob.arrayBuffer();
    const fileName = `${presentation.title.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim().replace(/\s+/g, '_')}.pptx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error('[export]', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
