import { serve } from 'https://deno.land/std@0.210.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Auth is handled client-side — the app verifies the user session before
  // calling this function. Deployed with --no-verify-jwt to skip gateway JWT check.

  const nvidiaKey = Deno.env.get('NVIDIA_API_KEY')
  const baseUrl = Deno.env.get('NVIDIA_BASE_URL') || 'https://integrate.api.nvidia.com/v1'
  if (!nvidiaKey) {
    return new Response(JSON.stringify({ error: 'NVIDIA_API_KEY not set' }), { status: 500 })
  }

  try {
    const body = await req.json()

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nvidiaKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[ai-proxy] NVIDIA error:', JSON.stringify(data))
      return new Response(JSON.stringify({ error: `NVIDIA API error: ${data?.error?.message || response.statusText}` }), {
        headers: { 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('[ai-proxy] fetch error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
