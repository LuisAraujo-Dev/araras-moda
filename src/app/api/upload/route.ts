import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || `upload-${Date.now()}.jpg`;

  if (!request.body) {
    return NextResponse.json(
      { error: 'Corpo da requisição vazio' },
      { status: 400 }
    );
  }

  try {
    const blob = await put(filename, request.body, {
      multipart: true,
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Erro no Vercel Blob Upload:", error);
    return NextResponse.json(
      { error: 'Erro no processamento da imagem.' },
      { status: 500 }
    );
  }
}