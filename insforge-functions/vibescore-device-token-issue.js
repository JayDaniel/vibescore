// Edge function: vibescore-device-token-issue
// Issues a long-lived device token for the authenticated user.
//
// Auth modes:
// - User mode (default): Authorization: Bearer <user_jwt>
// - Admin mode (bootstrap): Authorization: Bearer <service_role_key> with JSON body { user_id: "<uuid>" }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
};

module.exports = async function(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const body = await readJson(request);
  if (body.error) return json({ error: body.error }, body.status);

  const baseUrl = Deno.env.get('INSFORGE_INTERNAL_URL') || 'http://insforge:7130';
  const serviceRoleKey = Deno.env.get('INSFORGE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || null;

  const adminMode = Boolean(serviceRoleKey && bearer === serviceRoleKey);
  let userId = null;
  let dbClient = null;

  if (adminMode) {
    userId = typeof body.data?.user_id === 'string' ? body.data.user_id : null;
    if (!userId) return json({ error: 'user_id is required (admin mode)' }, 400);
    const anonKey = Deno.env.get('ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || null;
    dbClient = createClient({
      baseUrl,
      anonKey: anonKey || serviceRoleKey,
      edgeFunctionToken: serviceRoleKey
    });
  } else {
    const edgeClient = createClient({ baseUrl, edgeFunctionToken: bearer });
    const { data: userData, error: userErr } = await edgeClient.auth.getCurrentUser();
    userId = userData?.user?.id;
    if (userErr || !userId) return json({ error: 'Unauthorized' }, 401);
    dbClient = edgeClient;
  }

  const deviceName =
    sanitizeText(body.data?.device_name, 128) ||
    (Deno.env.get('HOSTNAME') ? `macOS (${Deno.env.get('HOSTNAME')})` : 'macOS');
  const platform = sanitizeText(body.data?.platform, 32) || 'macos';

  const deviceId = crypto.randomUUID();
  const tokenId = crypto.randomUUID();
  const token = generateToken();
  const tokenHash = await sha256Hex(token);

  const { error: deviceErr } = await dbClient.database
    .from('vibescore_tracker_devices')
    .insert([
      {
        id: deviceId,
        user_id: userId,
        device_name: deviceName,
        platform
      }
    ]);
  if (deviceErr) return json({ error: deviceErr.message }, 500);

  const { error: tokenErr } = await dbClient.database
    .from('vibescore_tracker_device_tokens')
    .insert([
      {
        id: tokenId,
        user_id: userId,
        device_id: deviceId,
        token_hash: tokenHash
      }
    ]);
  if (tokenErr) return json({ error: tokenErr.message }, 500);

  return json(
    {
      device_id: deviceId,
      token,
      created_at: new Date().toISOString()
    },
    200
  );
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function getBearerToken(headerValue) {
  if (!headerValue) return null;
  const prefix = 'Bearer ';
  if (!headerValue.startsWith(prefix)) return null;
  const token = headerValue.slice(prefix.length).trim();
  return token.length > 0 ? token : null;
}

async function readJson(request) {
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    return { error: 'Content-Type must be application/json', status: 415, data: null };
  }
  try {
    const data = await request.json();
    return { error: null, status: 200, data };
  } catch (_e) {
    return { error: 'Invalid JSON', status: 400, data: null };
  }
}

function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (s.length === 0) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
