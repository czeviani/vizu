import { NextRequest, NextResponse } from 'next/server';
import type { Presentation } from '@/types/slide';

// In-memory store for server-side (Vercel edge/serverless).
// For production, replace with Supabase.
const store = new Map<string, Presentation>();

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const p = store.get(id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  }
  return NextResponse.json(Array.from(store.values()));
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Presentation;
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  store.set(body.id, body);
  return NextResponse.json(body, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as Presentation;
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (!store.has(body.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const updated = { ...body, metadata: { ...body.metadata, updatedAt: new Date().toISOString() } };
  store.set(body.id, updated);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  store.delete(id);
  return NextResponse.json({ ok: true });
}
