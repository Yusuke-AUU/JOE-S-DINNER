const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { type, level, playerName } = JSON.parse(event.body || '{}');
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not set' }) };
  }

  let prompt = '';

  if (type === 'stage') {
    // ステージ自動生成
    const size = level <= 3 ? 6 : level <= 6 ? 7 : 8;
    const boxes = level <= 3 ? 1 : level <= 6 ? 2 : 3;
    prompt = `You are a Sokoban puzzle designer. Generate a valid Sokoban puzzle.
Rules:
- Grid size: ${size}x${size}
- Number of boxes (and goals): ${boxes}
- Player starts at a valid position
- All boxes must be solvable (not stuck in corners initially)
- Walls form a closed boundary

Return ONLY a JSON object in this exact format, no explanation:
{
  "grid": [
    "#########",
    "#  @    #",
    "#  B  G #",
    "#########"
  ],
  "hint": "A short English hint for the player (max 8 words)"
}

Legend: # = wall, space = floor, @ = player, B = box (Joe the dog), G = goal (food bowl)
Make sure the puzzle is solvable!`;

  } else if (type === 'comment') {
    // クリア時コメント生成
    const personalities = {
      'Papa': 'a cool dad who is proud and encouraging',
      'Mama': 'a gentle elegant mom who is warm and loving',
      'Bro': 'a cool teenage boy who acts casual but is actually happy',
      'Sis': 'a cheerful elementary school girl who is very excited',
    };
    const personality = personalities[playerName] || 'an encouraging person';
    prompt = `You are ${personality}. The player just solved a Sokoban puzzle where they helped Joe the Miniature Schnauzer dog reach his food bowl.
Write a short fun English comment to celebrate (max 12 words). Be in character. No quotation marks.`;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: type === 'stage' ? 400 : 60,
        temperature: type === 'stage' ? 0.7 : 0.9,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (type === 'stage') {
      // JSONをパース
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        };
      }
      return { statusCode: 500, body: JSON.stringify({ error: 'Invalid stage data' }) };
    } else {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: content.trim() }),
      };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
