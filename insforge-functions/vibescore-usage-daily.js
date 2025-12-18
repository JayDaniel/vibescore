// Edge function: vibescore-usage-daily
// Returns UTC daily token usage aggregates for the authenticated user.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
};

module.exports = async function(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = Deno.env.get('INSFORGE_INTERNAL_URL') || 'http://insforge:7130';
  const edgeClient = createClient({ baseUrl, edgeFunctionToken: bearer });

  const { data: userData, error: userErr } = await edgeClient.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (userErr || !userId) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const { from, to } = normalizeDateRange(url.searchParams.get('from'), url.searchParams.get('to'));

  const { data, error } = await edgeClient.database
    .from('vibescore_tracker_daily')
    .select('day,total_tokens,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens')
    .eq('user_id', userId)
    .gte('day', from)
    .lte('day', to)
    .order('day', { ascending: true });

  if (error) return json({ error: error.message }, 500);

  return json({ from, to, data: data || [] }, 200);
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

function normalizeDateRange(fromRaw, toRaw) {
  const today = new Date();
  const toDefault = formatDateUTC(today);
  const fromDefault = formatDateUTC(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 29)));

  const from = isDate(fromRaw) ? fromRaw : fromDefault;
  const to = isDate(toRaw) ? toRaw : toDefault;
  return { from, to };
}

function isDate(s) {
  return typeof s === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s);
}

function formatDateUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

