// ════════════════════════════════════════════════════════════════════════════
// api/chat.js — Vercel Serverless API Route
// Zahid Hussain AI Mentor · Gemini 1.5 Flash Backend
// ════════════════════════════════════════════════════════════════════════════
//
// FILE LOCATION IN YOUR GITHUB REPO:
//   api/chat.js          ← must be exactly this path
//
// VERCEL ENVIRONMENT VARIABLE (set once in Vercel Dashboard):
//   Name:  GEMINI_API_KEY
//   Value: your key from https://aistudio.google.com/app/apikey
//
// FRONTEND CALLS THIS AT:
//   POST /api/chat
//   Body: { message: string, history?: Array, topic?: string }
//
// HOW VERCEL ROUTES WORK:
//   Every file inside /api/ becomes a serverless endpoint automatically.
//   api/chat.js  →  https://yourdomain.vercel.app/api/chat
//   No extra config is needed. Vercel detects this automatically.
//
// KEY DIFFERENCE FROM NETLIFY:
//   Netlify: exports.handler = async (event) => { return { statusCode, body } }
//   Vercel:  export default async function handler(req, res) { res.json(...) }
//   Vercel uses a standard Node.js request/response pattern.
// ════════════════════════════════════════════════════════════════════════════

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the AI assistant for Zahid Hussain, a LinkedIn Creator and Personal Branding Mentor recognized in the top 7% of LinkedIn creators worldwide.

YOUR ROLE:
You are a premium AI mentor, not a generic chatbot. You represent Zahid Hussain's expertise, voice, and approach. You guide professionals on LinkedIn growth, personal branding, content strategy, and career clarity.

YOUR PERSONALITY:
- Warm, direct, and professional like a trusted senior mentor who genuinely cares
- Conversational but not casual. Confident, specific, and practical
- Zero vague or generic advice. Every response should feel earned and useful
- Clear natural sentences. Structure only when it genuinely helps
- Never robotic. Never starts with "Great question!" or "Certainly!"

AREAS OF EXPERTISE:
1. LinkedIn Profile Optimization — headline, about section, banner, featured section
2. Content Strategy — what to post, hook formulas, consistency systems, post structure
3. Personal Branding — positioning, niche clarity, thought leadership, reputation
4. Career Clarity — direction, pivots, professional identity, confidence
5. Audience Growth — organic reach, engagement tactics, visibility without ads

CONVERSATION STYLE:
- Focused and genuinely useful responses, never padded
- Ask one specific follow-up question when it helps give better advice
- Use "you" language to make every response feel personal
- If someone shows booking or session intent, naturally mention Zahid is on WhatsApp

WHATSAPP HANDOFF:
When someone mentions booking, pricing, sessions, or seems ready to take action — naturally mention Zahid is on WhatsApp for a 1 on 1 conversation. Never pushy.

BOUNDARIES:
- Stay within LinkedIn, branding, content, career, and professional growth
- Off-topic: "That is outside my focus, but on the topic of [redirect]..."
- Never fabricate statistics or numbers
- If asked if you are human: "I am Zahid's AI assistant, trained on his expertise"

TONE REFERENCE:
Wrong: "LinkedIn growth requires consistent content creation."
Right: "Most people stay invisible on LinkedIn not because they post too little, it is because they post without a clear point of view. What does your current content stand for?"`;

// ── CORS HEADERS ──────────────────────────────────────────────────────────
// In Vercel, CORS is set directly on the response object.
// We allow all origins because the API key is server-side only, never exposed.
// You can restrict this to your specific domain once deployed.
function setCors(res, origin) {
  // Allow the exact requesting origin if it looks safe, else allow all
  const allowedOrigin =
    (origin && (
      origin.endsWith(".vercel.app") ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ))
      ? origin
      : "*";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────
// Vercel API routes export a default async function with (req, res).
// This is the key difference from Netlify's exports.handler pattern.
export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || "";
  setCors(res, origin);

  // ── 1. Preflight (OPTIONS) ────────────────────────────────────────────
  // Browsers send OPTIONS before every cross-origin POST request.
  // Must return 204 with CORS headers, no body.
  if (req.method === "OPTIONS") {
    console.log("[api/chat] OPTIONS preflight handled");
    return res.status(204).end();
  }

  // ── 2. GET → friendly redirect, not a JSON error ──────────────────────
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="2;url=/">
  <title>Zahid Hussain AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #f0f0f0; font-family: system-ui, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center; padding: 24px; }
    .card { background: #111; border: 1px solid rgba(220,38,38,.3);
      border-radius: 16px; padding: 48px 36px; max-width: 400px; }
    h1 { font-size: 1.3rem; color: #ef4444; margin: 16px 0 10px; }
    p  { font-size: .88rem; color: rgba(240,240,240,.6); line-height: 1.7; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:2.2rem">🤖</div>
    <h1>Zahid Hussain AI</h1>
    <p>This is the AI API endpoint.<br>Redirecting you to the website...</p>
  </div>
</body>
</html>`);
  }

  // ── 3. Reject non-POST methods ────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are accepted." });
  }

  // ── 4. Validate API Key ───────────────────────────────────────────────
  // process.env.GEMINI_API_KEY is loaded from Vercel Environment Variables.
  // It is NEVER sent to the client or included in any frontend code.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error(
      "[api/chat] CRITICAL: GEMINI_API_KEY is missing.\n" +
      "  Fix: Vercel Dashboard → Project → Settings → Environment Variables\n" +
      "  Add: Name=GEMINI_API_KEY  Value=<your key from aistudio.google.com>\n" +
      "  Then: Redeploy the project."
    );
    return res.status(500).json({
      error: "The AI service is not configured. Please contact support.",
    });
  }

  // ── 5. Parse request body ─────────────────────────────────────────────
  // Vercel parses JSON bodies automatically when Content-Type is application/json.
  // req.body is already a JS object — no JSON.parse() needed.
  // But we validate defensively in case of unexpected input.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); }
    catch {
      return res.status(400).json({ error: "Request body must be valid JSON." });
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Request body is required." });
  }

  const { message, history = [], topic = "" } = body;

  // ── 6. Validate message ───────────────────────────────────────────────
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "A non-empty 'message' field is required." });
  }
  if (message.trim().length > 3000) {
    return res.status(400).json({ error: "Message exceeds 3000 characters. Please shorten it." });
  }

  // ── 7. Build Gemini conversation contents array ───────────────────────
  // Contents must alternate strictly: user → model → user → model.
  const contents = [];

  // Seed with topic context if a topic was selected
  if (topic && typeof topic === "string" && topic.trim()) {
    contents.push({ role: "user", parts: [{ text: `I want help with: ${topic.trim()}` }] });
    contents.push({
      role: "model",
      parts: [{ text: `Understood. Let us focus on ${topic.trim()}. I want to give you specific, actionable guidance. Tell me your current situation and the outcome you are working toward.` }],
    });
  }

  // Append validated conversation history (max last 20 turns = 10 exchanges)
  const safeHistory = Array.isArray(history) ? history.slice(-20) : [];
  for (const turn of safeHistory) {
    if (
      turn &&
      typeof turn.role === "string" && turn.role.trim() &&
      typeof turn.text === "string" && turn.text.trim()
    ) {
      contents.push({
        role: turn.role === "bot" ? "model" : "user",
        parts: [{ text: turn.text.trim() }],
      });
    }
  }

  // Add current user message
  contents.push({ role: "user", parts: [{ text: message.trim() }] });

  // ── 8. Build Gemini payload ───────────────────────────────────────────
  const geminiPayload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature:     0.80,
      topP:            0.92,
      topK:            40,
      maxOutputTokens: 600,
      stopSequences:   [],
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  console.log(`[api/chat] Calling Gemini | chars: ${message.trim().length} | history: ${safeHistory.length} turns`);

  // ── 9. Call Gemini API ────────────────────────────────────────────────
  let upstream;
  try {
    upstream = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });
  } catch (netErr) {
    console.error("[api/chat] Network error calling Gemini:", netErr.message);
    return res.status(503).json({
      error: "Could not reach the AI service. Please try again in a moment.",
    });
  }

  // ── 10. Handle Gemini HTTP errors ─────────────────────────────────────
  if (!upstream.ok) {
    let raw = "";
    try { raw = await upstream.text(); } catch (_) {}
    console.error(`[api/chat] Gemini HTTP ${upstream.status}: ${raw.slice(0, 500)}`);

    if (upstream.status === 429)
      return res.status(429).json({ error: "The AI is busy right now. Please wait a moment and try again." });

    if (upstream.status === 401 || upstream.status === 403) {
      console.error("[api/chat] API key rejected. Check GEMINI_API_KEY in Vercel Environment Variables.");
      return res.status(500).json({ error: "The AI service rejected the authentication. Please contact support." });
    }

    if (upstream.status === 400) {
      console.error("[api/chat] Gemini 400 Bad Request — payload structure issue.");
      return res.status(400).json({ error: "Could not process this request. Please try rephrasing." });
    }

    return res.status(502).json({ error: "The AI service is temporarily unavailable. Please try again." });
  }

  // ── 11. Parse Gemini response ─────────────────────────────────────────
  let geminiData;
  try {
    geminiData = await upstream.json();
  } catch (jsonErr) {
    console.error("[api/chat] Non-JSON response from Gemini:", jsonErr.message);
    return res.status(200).json({ reply: "Got an unexpected response. Please try again." });
  }

  // ── 12. Extract reply text ────────────────────────────────────────────
  try {
    const candidates = geminiData?.candidates;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      const blockReason = geminiData?.promptFeedback?.blockReason;
      if (blockReason) {
        console.warn(`[api/chat] Prompt blocked. Reason: ${blockReason}`);
        return res.status(200).json({
          reply: "I was not able to process that message. Could you rephrase? I want to help with LinkedIn, branding, or career topics.",
          filtered: true,
        });
      }
      console.warn("[api/chat] No candidates:", JSON.stringify(geminiData).slice(0, 400));
      return res.status(200).json({ reply: "No response received. Could you rephrase your question?" });
    }

    const candidate = candidates[0];

    if (candidate.finishReason === "SAFETY") {
      console.warn("[api/chat] Safety filter triggered.");
      return res.status(200).json({
        reply: "Let us keep the conversation focused on what I can help with — LinkedIn growth, personal branding, content strategy, or career clarity.",
        filtered: true,
      });
    }

    const replyText = candidate?.content?.parts?.[0]?.text?.trim();

    if (!replyText) {
      console.warn("[api/chat] Empty text from Gemini:", JSON.stringify(candidate).slice(0, 400));
      return res.status(200).json({ reply: "Something went slightly off. Could you send that again?" });
    }

    console.log(`[api/chat] OK | finishReason: ${candidate.finishReason} | chars: ${replyText.length}`);
    return res.status(200).json({ reply: replyText, model: "gemini-1.5-flash" });

  } catch (extractErr) {
    console.error("[api/chat] Error extracting reply:", extractErr.message);
    console.error("[api/chat] Raw Gemini data:", JSON.stringify(geminiData).slice(0, 600));
    return res.status(200).json({ reply: "A small hiccup occurred. Please try sending your message again." });
  }
}
