/**
 * Cloudflare Pages Functions: /api/events
 * Backend API with Admin Authentication & Privacy Enforcement
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
          "SELECT name, email, phone, registered_at FROM registrations WHERE event_id = ?"
        ).bind(ev.id).all();

        return {
          id: ev.id,
          name: ev.name,
          category: ev.category,
          date: ev.date,
          description: ev.description,
          maxPeople: ev.max_people,
          location: ev.location,
          image: ev.image_url,
          // If not admin, sanitize registrations array (protect privacy)
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
    message: "Cloudflare Pages Function active.",
    privacy: "RBAC Admin Enforcement Active"
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

    // Public Registration Endpoint (Anyone can register)
    if (action === "register" && env.DB) {
      const { eventId, name, email, phone } = data;
      await env.DB.prepare(
        "INSERT INTO registrations (event_id, name, email, phone, registered_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(eventId, name, email, phone, Date.now()).run();

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Protected Admin Endpoints (Require Admin Passcode)
    if (action === "create_event") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized. Admin passcode required." }), { status: 401 });
      }

      if (env.DB) {
        const { id, name, category, date, description, maxPeople, location, image } = data.event;
        await env.DB.prepare(
          "INSERT INTO events (id, name, category, date, description, max_people, location, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, name, category, date, description, maxPeople, location, image, Date.now()).run();
      }

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, mode: "client_sync" }), { headers: { "Content-Type": "application/json" } });
}
