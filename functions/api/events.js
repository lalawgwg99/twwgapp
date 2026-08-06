/**
 * Cloudflare Pages Functions: /api/events
 * Backend API powered by Cloudflare D1 & R2
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (env.DB) {
      const { results } = await env.DB.prepare(
        "SELECT * FROM events ORDER BY created_at DESC"
      ).all();

      const events = await Promise.all(results.map(async (ev) => {
        const { results: regs } = await env.DB.prepare(
          "SELECT name, email, registered_at FROM registrations WHERE event_id = ?"
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
          registrations: regs || []
        };
      }));

      return new Response(JSON.stringify({ events }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    console.error("D1 Fetch Error:", err);
  }

  // Fallback response if D1 is not bound yet
  return new Response(JSON.stringify({ message: "Cloudflare Pages Function active. Connect D1 DB to synchronize SQL storage." }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { action } = data;

    if (action === "create_event" && env.DB) {
      const { id, name, category, date, description, maxPeople, location, image } = data.event;
      await env.DB.prepare(
        "INSERT INTO events (id, name, category, date, description, max_people, location, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, name, category, date, description, maxPeople, location, image, Date.now()).run();

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (action === "register" && env.DB) {
      const { eventId, name, email, phone } = data;
      await env.DB.prepare(
        "INSERT INTO registrations (event_id, name, email, phone, registered_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(eventId, name, email, phone, Date.now()).run();

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, mode: "client_sync" }), { headers: { "Content-Type": "application/json" } });
}
