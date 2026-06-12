// ═══════════════════════════════════════════════════════════════
// NETER Pro — transcribe.js
// Recebe transcrição já pronta → Claude Haiku análise → salva Supabase
// ═══════════════════════════════════════════════════════════════
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL              || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  if (!ANTHROPIC_KEY)                 return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }) };

  try {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch(_) {}

    const { transcript, clientName, clientId, notes } = body;

    if (!transcript || !transcript.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Transcrição vazia' }) };
    }

    // ── Análise com Claude Haiku ───────────────────────────────
    const analysis = await analyzeWithHaiku(transcript, clientName || 'Cliente', notes || '', ANTHROPIC_KEY);

    // ── Salvar no Supabase ─────────────────────────────────────
    let sessionId = null;
    try {
      const { data: inserted } = await supabase
        .from('therapy_sessions')
        .insert({
          client_id:   clientId || null,
          client_name: clientName || 'Cliente',
          transcript:  null, // não salvamos a transcrição
          analysis:    JSON.stringify(analysis),
          notes:       notes || null
        })
        .select('id')
        .single();
      if (inserted) sessionId = inserted.id;
    } catch (dbErr) {
      console.error('Supabase insert:', dbErr.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        clientName: clientName || 'Cliente',
        analysis
      })
    };

  } catch (err) {
    console.error('[transcribe]', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Erro interno' }) };
  }
};

async function analyzeWithHaiku(transcript, clientName, notes, anthropicKey) {
  const prompt = `Você é um assistente clínico especializado em análise terapêutica sistêmica, baseado nas abordagens de Hellinger, Jung e nas Feridas Emocionais.

Analise a transcrição de sessão abaixo e gere um relatório estruturado.
${notes ? '\nCONTEXTO:\n' + notes + '\n' : ''}

TRANSCRIÇÃO:
${transcript.slice(0, 14000)}${transcript.length > 14000 ? '\n[... truncado ...]' : ''}

Responda APENAS com JSON válido, sem markdown, sem \`\`\`. Estrutura obrigatória:
{
  "resumo": "Parágrafo com tema central e arco emocional da sessão",
  "dores": ["dor 1", "dor 2"],
  "padroes": ["padrão sistêmico 1", "padrão sistêmico 2"],
  "atencao": ["ponto de atenção 1", "ponto de atenção 2"],
  "sugestoes": ["sugestão para próxima sessão 1", "sugestão 2"]
}`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!resp.ok) throw new Error('Claude Haiku: ' + await resp.text());

  const data = await resp.json();
  const raw = (data.content && data.content[0] && data.content[0].text) || '{}';

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch(_) {
    return { resumo: raw.slice(0, 300), dores: [], padroes: [], atencao: [], sugestoes: [] };
  }
}
