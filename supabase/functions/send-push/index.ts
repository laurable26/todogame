// Edge Function pour envoyer des notifications push via Firebase Cloud Messaging (API V1)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FIREBASE_PROJECT_ID = 'todogame-notifications';

const SERVICE_ACCOUNT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;
const PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    sub: SERVICE_ACCOUNT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = PRIVATE_KEY.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${signatureInput}.${signatureB64}`;
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function sendPushNotification(fcmToken: string, title: string, body: string, data?: any) {
  const accessToken = await getAccessToken();
  
  const message = {
    message: {
      token: fcmToken,
      notification: {
        title: title,
        body: body
      },
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200]
        }
      },
      data: data ? { payload: JSON.stringify(data) } : undefined
    }
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    }
  );

  const result = await response.json();
  return { success: response.ok, result };
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { fcm_token, title, body, data } = await req.json();

    if (!fcm_token || !title) {
      return new Response(
        JSON.stringify({ error: 'fcm_token and title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendPushNotification(fcm_token, title, body || '', data);

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});