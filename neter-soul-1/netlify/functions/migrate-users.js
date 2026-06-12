// Usa fetch nativo — sem dependências externas
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify([{status:'error',reason:'Env vars não configuradas'}]) };
  }

  let users;
  try { users = JSON.parse(event.body); } catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }
  if (!Array.isArray(users)) return { statusCode: 400, body: 'Expected array' };

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': 'Bearer ' + SERVICE_KEY,
    'Prefer': 'return=representation'
  };

  async function sbGet(table, filter) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + filter, { headers });
    return res.json();
  }
  async function sbPost(table, body) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST', headers, body: JSON.stringify(body)
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
  }

  const results = [];

  for (const u of users) {
    const name = (u.name || '').trim();
    if (!name) { results.push({ name: '?', status: 'skip', reason: 'sem nome' }); continue; }

    try {
      // Verificar se já existe
      const existing = await sbGet('profiles', 'name=ilike.' + encodeURIComponent(name) + '&select=id&limit=1');
      if (Array.isArray(existing) && existing.length > 0) {
        results.push({ name, status: 'skip', reason: 'já existe' }); continue;
      }

      // Inserir perfil
      const profileData = { name, role: 'client' };
      const email = (u.email || '').trim();
      const whatsapp = (u.whatsapp || u.phone || '').trim();
      if (email && email.includes('@')) profileData.email = email;
      if (whatsapp) profileData.phone = whatsapp;

      const profRes = await sbPost('profiles', profileData);
      if (!profRes.ok) {
        results.push({ name, status: 'error', reason: 'perfil: ' + JSON.stringify(profRes.data) }); continue;
      }

      const prof = Array.isArray(profRes.data) ? profRes.data[0] : profRes.data;
      const credits = u.credits || 500;

      await sbPost('user_credits', { user_id: prof.id, balance: credits });
      await sbPost('credit_transactions', {
        user_id: prof.id, amount: credits,
        type: 'bonus', description: 'Migração de conta local · Soul Neter'
      });

      results.push({ name, status: 'ok', credits });
    } catch(e) {
      results.push({ name, status: 'error', reason: e.message });
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(results)
  };
};
