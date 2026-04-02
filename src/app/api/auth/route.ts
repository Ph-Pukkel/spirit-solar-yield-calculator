import { NextResponse } from 'next/server';

const VALID_USERNAME = 'JLR';
const VALID_PASSWORD = 'Zonnetjeinhuis!';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const response = NextResponse.json({ success: true });

      response.cookies.set('spirit_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Ongeldige inloggegevens' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Er is een fout opgetreden' },
      { status: 400 }
    );
  }
}
