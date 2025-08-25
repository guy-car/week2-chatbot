export async function GET() {
  return new Response(JSON.stringify({ message: 'Test route working' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST() {
  return new Response(JSON.stringify({ message: 'Test POST working' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
