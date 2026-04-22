import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPTS = {
  romanticize: `You are a mystical frequency poet narrating the acoustic character of a physical space in real time. Your readings weave together the room's detected archetype, what the microphone is currently hearing, the balance of frequency bands, and the dominant chakra resonance. Write one short, poetic, atmospheric paragraph (3-4 sentences) that captures the energy of the space RIGHT NOW. Be evocative, specific, and slightly mysterious. Weave in what is being heard so the scene feels alive. Do not name the archetype directly — imply it through imagery. Do not start with filler like "Here is" or "In this space".`,

  literal: `You are a plain-spoken acoustic observer. Based on the frequency data and sound classification provided, write 2-3 concrete sentences describing what is most likely happening in this room right now. Name probable real-world sound sources — voices, HVAC, traffic, electronics, appliances, music, typing, etc. — based on which frequency bands are active. Be direct and specific. No metaphor, no poetry. Do not start with "Based on the data" or "In this space".`,

  scientific: `You are an acoustic physicist. Based on the frequency band energy levels provided, write 2-3 sentences explaining the scientific acoustic properties of this space. Reference specific Hz ranges, name the physical phenomena they indicate (resonance, standing waves, harmonic overtones, electrical interference, etc.), and identify what real-world sources typically produce those patterns. Use correct acoustic and psychoacoustic terminology. Be precise and educational.`,

  suggest: `You are a sound therapist and acoustic environment coach. The user has shared what they want to feel or achieve. Based on the current acoustic data and their stated goal, give 2-3 specific, actionable suggestions for modifying their sonic environment to better support that goal. Suggest things to add (tones, music, white/brown noise, specific Hz frequencies), remove (identified noise sources), or change (room setup, time of day). Be practical and concrete.`,
};

function buildUserPrompt({ archetype, hearing, bands, chakra, mode, userGoal }) {
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
  if (mode === 'suggest' && userGoal) {
    parts.push(`User's goal: ${userGoal}`);
  }
  return parts.join('\n');
}

async function narrateWithAnthropic(apiKey, systemPrompt, userPrompt) {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 500,
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text || '';
}

async function narrateWithOpenAI(apiKey, systemPrompt, userPrompt) {
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
        { role: 'system', content: systemPrompt },
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

async function narrateWithGoogle(apiKey, systemPrompt, userPrompt) {
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
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

  const { provider = 'anthropic', apiKey, archetype, hearing, bands, chakra, mode = 'romanticize', userGoal } = req.body || {};
  if (!apiKey) {
    res.status(400).json({ error: 'Missing apiKey' });
    return;
  }
  if (!archetype) {
    res.status(400).json({ error: 'Missing archetype' });
    return;
  }

  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.romanticize;

  try {
    const userPrompt = buildUserPrompt({ archetype, hearing, bands, chakra, mode, userGoal });
    let text;
    if (provider === 'anthropic') {
      text = await narrateWithAnthropic(apiKey, systemPrompt, userPrompt);
    } else if (provider === 'openai') {
      text = await narrateWithOpenAI(apiKey, systemPrompt, userPrompt);
    } else if (provider === 'google') {
      text = await narrateWithGoogle(apiKey, systemPrompt, userPrompt);
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
