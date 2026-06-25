import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getUserFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const user = await getUserFromToken(token);

  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
