import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // TODO: insert into a `subscribers` D1 table, or call your ESP's API.
  console.log("Newsletter signup (not yet persisted):", email);

  return Response.redirect(new URL("/?subscribed=1", request.url), 303);
};
