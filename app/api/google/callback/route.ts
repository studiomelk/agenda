import { NextResponse } from "next/server";
import { saveGoogleTokens, type GoogleTokenData } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") || "";
  const matchState = cookieHeader.match(/google_oauth_state=([^;]+)/);
  const savedState = matchState ? matchState[1] : null;

  if (error) {
    return NextResponse.redirect(`${url.origin}/?google_status=error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/?google_status=error&message=Codigo+OAuth+nao+recebido`);
  }

  if (savedState && state !== savedState) {
    return NextResponse.redirect(`${url.origin}/?google_status=error&message=Falha+de+validacao+CSRF+state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${url.origin}/?google_status=error&message=Credenciais+do+Google+nao+configuradas`);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    const body = await tokenResponse.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || !body.access_token) {
      return NextResponse.redirect(
        `${url.origin}/?google_status=error&message=${encodeURIComponent(body.error_description || body.error || "Falha na troca do token")}`
      );
    }

    let email = "";
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { authorization: `Bearer ${body.access_token}` },
        cache: "no-store",
      });
      if (userRes.ok) {
        const userInfo = await userRes.json() as { email?: string };
        email = userInfo.email || "";
      }
    } catch {
      // User info fetching optional
    }

    const tokenData: GoogleTokenData = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expiry_date: Date.now() + (body.expires_in || 3600) * 1000,
      scope: body.scope,
      email,
      updated_at: new Date().toISOString(),
    };

    await saveGoogleTokens(tokenData);

    const response = NextResponse.redirect(`${url.origin}/?google_status=success${email ? `&email=${encodeURIComponent(email)}` : ""}`);
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (err) {
    return NextResponse.redirect(
      `${url.origin}/?google_status=error&message=${encodeURIComponent(err instanceof Error ? err.message : "Erro desconhecido")}`
    );
  }
}
