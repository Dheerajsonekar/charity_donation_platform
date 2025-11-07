const axios = require("axios");
const db = require("../config/db.js");

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_MODEL = "jina-embeddings-v3";

// ------------------ Utility Functions ------------------

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

async function generateEmbedding(text) {
  try {
    const res = await axios.post(
      JINA_API_URL,
      { model: JINA_MODEL, input: [text] },
      { headers: { Authorization: `Bearer ${process.env.JINA_API_KEY}` } }
    );
    return res.data.data[0].embedding;
  } catch (err) {
    console.error("❌ Embedding generation failed:", err.message);
    return [];
  }
}

// ------------------ Controller Functions ------------------

/**
 * Generate embeddings for ALL campaigns (admin/dev utility)
 */
const generateAllEmbeddings = async (req, res) => {
  try {
    const [campaigns] = await db.query("SELECT id, title, description FROM campaigns");

    for (const c of campaigns) {
      const text = `${c.title}. ${c.description}`;
      const embedding = await generateEmbedding(text);
      await db.query("UPDATE campaigns SET embedding = ? WHERE id = ?", [
        JSON.stringify(embedding),
        c.id,
      ]);
    }

    res.json({ success: true, message: "✅ All embeddings generated successfully" });
  } catch (err) {
    console.error("⚠️ Embedding generation error:", err.message);
    res.status(500).json({ success: false, error: "Failed to generate embeddings" });
  }
};

/**
 * Get AI-based campaign recommendations by similarity
 */
const getRecommendations = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch target campaign
    const [rows] = await db.query("SELECT * FROM campaigns WHERE id = ?", [id]);
    const target = rows[0];
    if (!target) return res.status(404).json({ error: "Campaign not found" });

    // 2. Ensure embedding exists
    let targetEmbedding = target.embedding ? JSON.parse(target.embedding) : [];
    if (targetEmbedding.length === 0) {
      const text = `${target.title}. ${target.description}`;
      targetEmbedding = await generateEmbedding(text);
      await db.query("UPDATE campaigns SET embedding = ? WHERE id = ?", [
        JSON.stringify(targetEmbedding),
        id,
      ]);
    }

    // 3. Compare with other campaigns
    const [others] = await db.query("SELECT * FROM campaigns WHERE id != ?", [id]);
    const recs = [];

    for (const c of others) {
      if (!c.embedding) continue;
      const emb = JSON.parse(c.embedding);
      const score = cosineSimilarity(targetEmbedding, emb);
      recs.push({ ...c, score });
    }

    // 4. Sort and send top 5
    const recommendations = recs.sort((a, b) => b.score - a.score).slice(0, 5);
    res.json({ recommendations });
  } catch (err) {
    console.error("Recommendation error:", err.message);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
};

// ------------------ Exports ------------------

module.exports = {
  generateAllEmbeddings,
  getRecommendations,
};
