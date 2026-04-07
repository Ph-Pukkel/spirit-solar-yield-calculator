import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service-role key, fall back to anon key (feedback table has a
  // public insert RLS policy so anon key is sufficient).
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    message: string;
    screenshot?: string;
    pageUrl: string;
    userAgent: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, message, screenshot, pageUrl, userAgent } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // Insert into feedback table
  const { data: row, error: dbError } = await supabase
    .from('feedback')
    .insert({
      name: name || null,
      message: message.trim(),
      page_url: pageUrl || null,
      user_agent: userAgent || null,
      screenshot_data: screenshot || null,
      email_sent: false,
    })
    .select('id')
    .single();

  if (dbError) {
    console.error('Feedback DB error:', dbError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Send email if RESEND_API_KEY is set
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && row) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      const subject = `Vraag Dennis: ${message.trim().slice(0, 60)}${message.trim().length > 60 ? '...' : ''}`;

      const screenshotHtml = screenshot
        ? `<p><strong>Screenshot:</strong></p><img src="${screenshot}" alt="Screenshot" style="max-width:600px;border-radius:8px;border:1px solid #ddd;" />`
        : '';

      const htmlBody = `
        <div style="font-family: 'Open Sans', system-ui, sans-serif; max-width: 640px; margin: 0 auto; color: #1A1B1A;">
          <div style="background: #E14C2A; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Vraag Dennis — Nieuw feedbackbericht</h1>
          </div>
          <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width:100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #707070; font-size: 13px; width: 120px; vertical-align: top;">Naam</td>
                <td style="padding: 8px 0; font-size: 14px;">${name ? escapeHtml(name) : '<em style="color:#A5A5A4">Niet opgegeven</em>'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #707070; font-size: 13px; vertical-align: top;">Bericht</td>
                <td style="padding: 8px 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(message.trim())}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #707070; font-size: 13px; vertical-align: top;">Pagina</td>
                <td style="padding: 8px 0; font-size: 14px;"><a href="${escapeHtml(pageUrl || '')}" style="color: #E14C2A;">${escapeHtml(pageUrl || '—')}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #707070; font-size: 13px; vertical-align: top;">User Agent</td>
                <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #707070;">${escapeHtml(userAgent || '—')}</td>
              </tr>
            </table>
            ${screenshotHtml}
          </div>
        </div>
      `;

      const fromAddress = 'Vraag Dennis <onboarding@resend.dev>';

      await resend.emails.send({
        from: fromAddress,
        to: 'dennis_hendriks@yahoo.com',
        subject,
        html: htmlBody,
      });

      // Mark email as sent
      await supabase
        .from('feedback')
        .update({ email_sent: true })
        .eq('id', row.id);
    } catch (emailError) {
      console.error('Feedback email error:', emailError);
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json({ success: true });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
