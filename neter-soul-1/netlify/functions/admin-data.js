const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!SUPABASE_URL || !KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Env vars missing' }) };
  }

  const sb = createClient(SUPABASE_URL, KEY);
  const q = event.queryStringParameters || {};
  const resource = q.resource || 'profiles';
  const select   = q.select   || '*';
  const order    = q.order    || null;
  const limit    = parseInt(q.limit) || 100;

  try {
    let query = sb.from(resource).select(select).limit(limit);
    if (order) {
      const [col, dir] = order.split('.');
      query = query.order(col, { ascending: dir !== 'desc' });
    }
    if (q.filter) {
      // ex: filter=type=eq.purchase
      const match = q.filter.match(/^(\w+)=eq\.(.+)$/);
      if (match) query = query.eq(match[1], match[2]);
    }

    const { data, error } = await query;
    if (error) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: error.message }) };

    return { statusCode: 200, headers: CORS, body: JSON.stringify(data || []) };
  } catch(e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
