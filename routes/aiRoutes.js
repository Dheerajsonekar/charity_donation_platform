const express = require("express");
const {
  getRecommendations,
  generateAllEmbeddings,
} = require("../controllers/aiController");

const router = express.Router();

// GET: get top recommendations for a campaign
router.get("/recommend/:id", getRecommendations);

// POST: generate embeddings for all campaigns
router.post("/generate-embeddings", generateAllEmbeddings);

module.exports = router;
