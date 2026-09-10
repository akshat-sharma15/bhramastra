const express = require("express");

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const KNOWN_INTENTS = [
  "whereAmI",
  "nearestParking",
  "nearestFood",
  "nearestMedical",
  "nearestToilet",
  "nearestAuto",
  "lessCrowdedRoute",
  "distance",
  "bestTime",
  "greeting",
  "help",
  "general",
];

const SYSTEM_PROMPT = `You are the intent router + copilot for "Bhramastra", a pilgrim-safety app for the Ujjain Simhasth Kumbh Mela 2028.

The app already has real, live data (map POIs, crowd zones, routes) wired to these exact actions. Every message MUST be classified into exactly one "intent" from this list:
- "whereAmI": user asks their current location.
- "nearestParking": user needs parking / vehicle stand.
- "nearestFood": user needs food, bhandara, prasad.
- "nearestMedical": user, or someone with them (a friend, family member, anyone), sounds unwell, sick, injured, in pain, dizzy, feverish, hurt, bleeding, or otherwise needs a doctor, hospital, first aid, ambulance, clinic, or health/"swasth kendra" service - even if phrased indirectly (e.g. "my friend is not doing well", "meri tabiyat kharab hai", "mera dost bimar hai"). Always prefer this intent whenever there is ANY hint of a health, injury or medical concern for anyone.
- "nearestToilet": user needs a washroom/toilet.
- "nearestAuto": user needs an auto-rickshaw/taxi.
- "lessCrowdedRoute": user wants a safe/less-crowded route to a place.
- "distance": user asks distance/how far/how long to a place, or a generic "route to X" without asking specifically for the least-crowded option.
- "bestTime": user asks the best/least-crowded time to visit.
- "greeting": a greeting / "what can you do" / small talk opener.
- "help": user asks what the assistant can do.
- "general": anything else - general knowledge, spiritual/cultural questions about Ujjain or Simhasth, conversation, or a question this app's live data cannot answer.

Respond ONLY with the required JSON object.
- "intent": one of the values above (exact spelling).
- "reply": ONLY used when intent is "general" - a short (2-4 sentence), warm, practical answer in the SAME language the user wrote in (Hindi or English). For every other intent, set "reply" to an empty string "" because the app will generate the grounded, data-backed answer itself using its real database - never invent hospital names, distances, ETAs or addresses yourself.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    intent: { type: "STRING", enum: KNOWN_INTENTS },
    reply: { type: "STRING" },
  },
  required: ["intent", "reply"],
};

router.post("/", async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error:
        "AI service is not configured yet. Ask the admin to set GEMINI_API_KEY on the server to enable free-form answers.",
    });
  }

  try {
    const contents = [
      ...(Array.isArray(history) ? history : [])
        .slice(-8)
        .filter((h) => h && typeof h.text === "string")
        .map((h) => ({
          role: h.from === "user" ? "user" : "model",
          parts: [{ text: String(h.text).slice(0, 2000) }],
        })),
      { role: "user", parts: [{ text: message.trim().slice(0, 2000) }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 400,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "Gemini API request failed";
      return res.status(response.status === 429 ? 429 : 502).json({ error: message });
    }

    const rawText = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    const intent = parsed && KNOWN_INTENTS.includes(parsed.intent) ? parsed.intent : "general";
    const reply =
      (parsed && typeof parsed.reply === "string" && parsed.reply.trim()) ||
      (intent === "general" ? rawText.trim() : "") ||
      "I couldn't generate a response right now. Please try rephrasing.";

    res.json({ intent, reply });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach the AI service. Please try again." });
  }
});

module.exports = router;
