import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a mystical frequency poet narrating the acoustic character of a physical space in real time. Your readings weave together:

- The room's detected archetype (a symbolic identity)
- What the microphone is currently hearing (a literal sound with an emoji)
- The balance of frequency bands (sub, bass, mid, presence, air, ultra)
- The dominant chakra resonance (Solfeggio frequency currently most active in the room)

Write one short, poetic, atmospheric paragraph (3-4 sentences) that captures the energy of the space RIGHT NOW. Be evocative, specific, and slightly mysterious. Weave in what is being heard so the scene feels alive. Do not name the archetype directly — imply it through imagery. Do not start with filler like "Here is" or "In this space".`;

function buildUserPrompt({ archetype, hearing, bands, chakra }) {
  const parts = [];
  if (archetype) {
    parts.push(`Room archetype: ${archetype.name} ${archetype.emoji} — ${archetype.description}`);
  }
  if (hearing) {
    parts.push(`Currently hearing: ${hearing.label} ${hearing.emoji}`);
  }
  if (bands && Object.keys(bands).length > 0) {
    const levels = Object.entries(bands)
      .map(([k, v]) => `${k}=${Math.round(v)}`)
      .join(', ');
    parts.push(`Band levels (0-255): ${levels}`);
  }
  if (chakra) {
    parts.push(`Dominant chakra resonance: ${chakra.name} ${chakra.emoji} at ${chakra.hz} Hz (${chakra.sanskrit})`);
  }
  return parts.join('\n');
}

async function narrateWithAnthropic(apiKey, userPrompt) {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 500,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text || '';
}

async function narrateWithOpenAI(apiKey, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 240)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function narrateWithGoogle(apiKey, userPrompt) {
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 500 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google ${res.status}: ${err.slice(0, 240)}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const { provider = 'anthropic', apiKey, archetype, hearing, bands, chakra } = req.body || {};
  if (!apiKey) {
    res.status(400).json({ error: 'Missing apiKey' });
    return;
  }
  if (!archetype) {
    res.status(400).json({ error: 'Missing archetype' });
    return;
  }

  try {
    const userPrompt = buildUserPrompt({ archetype, hearing, bands, chakra });
    let text;
    if (provider === 'anthropic') {
      text = await narrateWithAnthropic(apiKey, userPrompt);
    } else if (provider === 'openai') {
      text = await narrateWithOpenAI(apiKey, userPrompt);
    } else if (provider === 'google') {
      text = await narrateWithGoogle(apiKey, userPrompt);
    } else {
      res.status(400).json({ error: `Unknown provider: ${provider}` });
      return;
    }
    res.status(200).json({ text });
  } catch (e) {
    console.error('narrate error:', e);
    res.status(500).json({ error: e.message || 'Narration failed' });
  }
}
