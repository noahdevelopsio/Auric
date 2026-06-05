import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}
