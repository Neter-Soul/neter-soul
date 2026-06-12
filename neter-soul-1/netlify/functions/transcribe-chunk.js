// ═══════════════════════════════════════════════════════════════
// NETER Pro — transcribe-chunk.js
// Recebe um chunk de áudio (multipart) → Groq Whisper → retorna texto
// ═══════════════════════════════════════════════════════════════
const GROQ_KEY = process.env.GROQ_API_KEY || '';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  if (!GROQ_KEY)                      return { statusCode: 500, headers, body: JSON.stringify({ error: 'GROQ_API_KEY não configurada' }) };

  try {
    // Parse multipart para extrair o blob de áudio
    const { audioBuffer, mimeType } = await parseAudioChunk(event);

    if (!audioBuffer || audioBuffer.length < 100) {
      return { statusCode: 200, headers, body: JSON.stringify({ text: '' }) };
    }

    // Montar FormData para Groq Whisper
    const boundary = '----NetlifyBoundary' + Date.now();
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const filename = 'chunk.' + ext;

    const preamble = Buffer.from(
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="' + filename + '"\r\n' +
      'Content-Type: ' + mimeType + '\r\n\r\n'
    );
    const modelPart = Buffer.from(
      '\r\n--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="model"\r\n\r\n' +
      'whisper-large-v3-turbo' +
      '\r\n--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="language"\r\n\r\n' +
      'pt' +
      '\r\n--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="response_format"\r\n\r\n' +
      'json' +
      '\r\n--' + boundary + '--\r\n'
    );

    const body = Buffer.concat([preamble, audioBuffer, modelPart]);

    const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_KEY,
        'Content-Type': 'multipart/form-data; boundary=' + boundary
      },
      body
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[transcribe-chunk] Groq error:', err);
      return { statusCode: 200, headers, body: JSON.stringify({ text: '' }) };
    }

    const data = await resp.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: data.text || '' })
    };

  } catch (err) {
    console.error('[transcribe-chunk]', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ text: '' }) };
  }
};

// ── Parse multipart simples ───────────────────────────────────────
async function parseAudioChunk(event) {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) throw new Error('Sem boundary');

  const boundary = boundaryMatch[1];
  const bodyBuf = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary');
  const sep = Buffer.from('\r\n--' + boundary);
  const parts = splitBuffer(bodyBuf, sep);

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headerStr = part.slice(0, headerEnd).toString('utf8');
    if (!headerStr.includes('name="audio"')) continue;
    const data = part.slice(headerEnd + 4);
    const trimmed = (data[data.length-2]===13 && data[data.length-1]===10) ? data.slice(0,-2) : data;
    const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
    const mimeType = ctMatch ? ctMatch[1].trim() : 'audio/webm';
    return { audioBuffer: trimmed, mimeType };
  }
  return { audioBuffer: null, mimeType: 'audio/webm' };
}

function splitBuffer(buf, sep) {
  const parts = []; let start = 0, idx;
  while ((idx = indexOfBuf(buf, sep, start)) !== -1) {
    parts.push(buf.slice(start, idx));
    start = idx + sep.length;
  }
  parts.push(buf.slice(start));
  return parts.filter(p => p.length > 0);
}

function indexOfBuf(haystack, needle, offset) {
  offset = offset || 0;
  for (let i = offset; i <= haystack.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i+j] !== needle[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}
