import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  try {
    const blob = await request.blob();
    
    const result = await put(filename, blob, {
      access: 'public',
      addRandomSuffix: true, 
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}