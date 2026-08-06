/**
 * Cloudflare Pages Functions: /api/events
 * Commercial Pro Edition Backend API with RBAC & Questionnaire Engine
 */

const DEFAULT_PASSCODE = "admin888";

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminPasscode = request.headers.get("X-Admin-Passcode");
  const isAdmin = (adminPasscode === (env.ADMIN_PASSCODE || DEFAULT_PASSCODE));

  try {
    if (env.DB) {
      const { results } = await env.DB.prepare(
        "SELECT * FROM events ORDER BY created_at DESC"
      ).all();

      const events = await Promise.all(results.map(async (ev) => {
        const { results: regs } = await env.DB.prepare(
          "SELECT name, email, phone, answers, checked_in, registered_at FROM registrations WHERE event_id = ?"
        ).bind(ev.id).all();

        return {
          id: ev.id,
          name: ev.name,
          category: ev.category,
          customBadge: ev.custom_badge,
          priceTier: ev.price_tier,
          date: ev.date,
          description: ev.description,
          maxPeople: ev.max_people,
          location: ev.location,
          image: ev.image_url,
          phoneRequired: ev.phone_required === 1,
          customQuestions: ev.custom_questions ? JSON.parse(ev.custom_questions) : [],
          // Sanitize registrations if not admin
          registrations: isAdmin ? (regs || []) : (regs ? regs.map(() => ({})) : [])
        };
      }));

      return new Response(JSON.stringify({ events }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    console.error("D1 Fetch Error:", err);
  }

  return new Response(JSON.stringify({
    message: "Cloudflare Pages Function Pro Edition active.",
    engine: "Google Forms Style Questionnaire Backend"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminPasscode = request.headers.get("X-Admin-Passcode");
  const isAdmin = (adminPasscode === (env.ADMIN_PASSCODE || DEFAULT_PASSCODE));

  try {
    const data = await request.json();
    const { action } = data;

    // Public Registration Endpoint
    if (action === "register" && env.DB) {
      const { eventId, name, email, phone, answers } = data;
      await env.DB.prepare(
        "INSERT INTO registrations (event_id, name, email, phone, answers, checked_in, registered_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
      ).bind(eventId, name, email, phone, JSON.stringify(answers || {}), Date.now()).run();

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Protected Admin Endpoints
    if (action === "create_event") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized. Admin passcode required." }), { status: 401 });
      }

      if (env.DB) {
        const { id, name, category, customBadge, priceTier, date, description, maxPeople, location, image, phoneRequired, customQuestions } = data.event;
        await env.DB.prepare(
          "INSERT INTO events (id, name, category, custom_badge, price_tier, date, description, max_people, location, image_url, phone_required, custom_questions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, name, category, customBadge, priceTier, date, description, maxPeople, location, image, phoneRequired ? 1 : 0, JSON.stringify(customQuestions || []), Date.now()).run();
      }

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, mode: "client_sync" }), { headers: { "Content-Type": "application/json" } });
}
