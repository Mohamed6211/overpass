const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter"
];

async function queryOverpass(query, retries = 4) {
  for (let i = 0; i < retries; i++) {
    const endpoint = OVERPASS_ENDPOINTS[i % OVERPASS_ENDPOINTS.length];

    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" }
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.json();

    } catch (err) {
      console.log(`Attempt ${i + 1} failed:`, err.message);

      if (i === retries - 1) throw err;

      await new Promise(r => setTimeout(r, 3000));
    }
  }
}
app.get("/", (req, res) => {
  res.send("Overpass proxy is running");
});
app.post("/overpass", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const data = await queryOverpass(query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
