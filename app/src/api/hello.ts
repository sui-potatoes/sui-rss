export default function handler(req: Request): Response | Promise<Response> {
    return new Response(JSON.stringify({ message: "Hello from API" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
