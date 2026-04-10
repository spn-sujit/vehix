import arcjet, { shield, detectBot } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"]
    })
  ]
});

export async function POST(req) {
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    return Response.json({ error: "Blocked" }, { status: 403 });
  }

  return Response.json({ ok: true });
}