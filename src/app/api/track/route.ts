import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { page } = await request.json();
    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;

    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    await supabase.from('page_visits').insert({
      page: page || '/',
      user_agent: userAgent,
      referrer: referrer,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
