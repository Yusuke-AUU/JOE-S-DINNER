

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
    // Level-based parameters
    const size     = level <= 2 ? 7 : level <= 4 ? 8 : level <= 6 ? 9 : 10;
    const boxes    = level <= 2 ? 1 : level <= 5 ? 2 : 3;
    const walls    = level <= 2 ? 3 : level <= 4 ? 5 : level <= 6 ? 8 : 12;

    prompt = `You are an expert Sokoban puzzle designer. Create a VALID, SOLVABLE Sokoban puzzle.

STRICT RULES:
1. Grid is ${size} columns x ${size} rows
2. Exactly ${boxes} box(es) labeled B, exactly ${boxes} goal(s) labeled G
3. Exactly 1 player labeled @
4. Outer border MUST be all # walls
5. Add ${walls} extra # wall cells INSIDE the grid to make it challenging
6. NO box must be placed in a corner (diagonal walls) at the START
7. Every box MUST have a valid path to reach its goal
8. Player must be able to reach every box
9. Make it require at least ${level * 3} moves to solve

LEGEND:
# = wall
  = empty floor (space character)
@ = player start
B = Joe the dog (box to push)
G = food bowl (goal)

IMPORTANT: Return ONLY raw JSON, no markdown, no explanation:
{"grid":["##########","#  @     #","# B    G #","#   ##   #","#        #","##########"],"hint":"short English hint max 8 words"}

The grid must be a rectangle. Every row must have the same length (${size} chars).
DOUBLE CHECK: count B's = count G's = ${boxes}. Count @'s = 1.`;

  } else if (type === 'comment') {
    const personalities = {
      'Papa': 'a sporty cool Japanese dad, proud but tries to act casual',
      'Mama': 'a gentle elegant Japanese mom, warm and graceful',
      'Bro':  'a cool Japanese middle schooler, tries to act indifferent but is secretly excited',
      'Sis':  'a super cheerful Japanese elementary school girl, very energetic and cute',
    };
    const personality = personalities[playerName] || 'an encouraging person';
    prompt = `You are ${personality}. Joe the Miniature Schnauzer dog just reached his food bowl in a puzzle game!
Write ONE short celebratory English sentence (max 10 words). Stay in character. No quotation marks. Be fun and natural.`;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: type === 'stage' ? 600 : 60,
        temperature: type === 'stage' ? 0.5 : 0.9,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    if (type === 'stage') {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { statusCode: 500, body: JSON.stringify({ error: 'No JSON found' }) };
      }
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate: count boxes and goals
      const gridStr = parsed.grid.join('');
      const boxCount  = (gridStr.match(/B/g) || []).length;
      const goalCount = (gridStr.match(/G/g) || []).length;
      const playerCount = (gridStr.match(/@/g) || []).length;

      const rows = parsed.grid || [];
      const rowLength = rows[0]?.length || 0;
      const rectangular = rowLength > 0 && rows.every(row => typeof row === 'string' && row.length === rowLength);

      if (boxCount !== goalCount || playerCount !== 1 || boxCount === 0 || !rectangular) {
        return { statusCode: 500, body: JSON.stringify({ error: `Invalid stage: boxes=${boxCount} goals=${goalCount} players=${playerCount} rectangular=${rectangular}` }) };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      };
    } else {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: content }),
      };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
