const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getServerKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) {
    try {
      const defaultKey = JSON.parse(secretKeys).default
      if (typeof defaultKey === 'string' && defaultKey) return defaultKey
    } catch {
      // Fall back to the legacy built-in variable below.
    }
  }

  const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (legacyServiceKey) return legacyServiceKey
  throw new Error('Server credential is unavailable')
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!

async function privilegedFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('apikey', getServerKey())
  return fetch(`${supabaseUrl}${path}`, { ...init, headers })
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => null)
  return body?.msg || body?.message || body?.error_description || 'Unexpected server response'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Not authenticated')

    // Verify caller is an admin
    const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: Deno.env.get('SUPABASE_ANON_KEY')!,
        Authorization: authHeader,
      },
    })
    if (!callerResponse.ok) throw new Error('Not authenticated')
    const caller = await callerResponse.json()
    if (!caller?.id || !caller?.email) throw new Error('Not authenticated')

    const profileResponse = await privilegedFetch(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&role=eq.admin&account_status=eq.approved&select=id`
    )
    if (!profileResponse.ok) throw new Error(await responseError(profileResponse))
    const [adminRow] = await profileResponse.json()
    if (!adminRow) throw new Error('Admin access required')

    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : ''
    if (!email || !password) throw new Error('Email and password are required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email is required')
    if (password.length < 8) throw new Error('Password must be at least 8 characters')

    // Create auth user — email pre-confirmed, no confirmation email sent
    const createResponse = await privilegedFetch('/auth/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    })
    if (!createResponse.ok) throw new Error(await responseError(createResponse))
    const created = await createResponse.json()

    // Profile row is created by the handle_new_user trigger — update it to staff role.
    const profileUpdateResponse = await privilegedFetch(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(created.id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'staff', account_status: 'approved', approved: true, full_name: fullName }),
      }
    )
    if (!profileUpdateResponse.ok) throw new Error(await responseError(profileUpdateResponse))

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
