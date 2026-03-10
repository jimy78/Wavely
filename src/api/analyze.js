export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idea } = req.body;
  if (!idea) return res.status(400).json({ error: "Missing idea" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `Tu es un expert en viralité TikTok. Analyse l'idée de vidéo et réponds UNIQUEMENT en JSON valide sans markdown ni backticks.
Format exact:
{"score":<0-100>,"verdict":"<emoji verdict>","factors":[{"label":"Hook (0-3s)","score":<0-100>,"color":"#00f5d4"},{"label":"Trend Alignment","score":<0-100>,"color":"#f72585"},{"label":"Audio Match","score":<0-100>,"color":"#7209b7"},{"label":"Caption Power","score":<0-100>,"color":"#f9c74f"},{"label":"Posting Timing","score":<0-100>,"color":"#00f5d4"}],"bestTime":"<créneau>","suggestedSound":"<son TikTok>","tip":"<conseil concret>","captions":["<caption1 avec hashtags>","<caption2>","<caption3>"]}`,
        messages: [{ role: "user", content: `Idée TikTok : ${idea}` }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return res.status(500).json({ error: "No response from AI" });

    const result = JSON.parse(text);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: "AI analysis failed", detail: e.message });
  }
}
