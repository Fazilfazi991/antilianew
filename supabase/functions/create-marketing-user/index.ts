import { createClient } from 'jsr:@supabase/supabase-js@2'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      getServerKey()
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Not authenticated')

    // Verify caller is an admin
    const { data: { user: caller }, error: authErr } = await serviceClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !caller?.email) throw new Error('Not authenticated')

    const { data: adminRow } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('id', caller.id)
      .eq('role', 'admin')
      .eq('account_status', 'approved')
      .single()
    if (!adminRow) throw new Error('Admin access required')

    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : ''
    if (!email || !password) throw new Error('Email and password are required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email is required')
    if (password.length < 8) throw new Error('Password must be at least 8 characters')

    // Create auth user — email pre-confirmed, no confirmation email sent
    const { data: created, error: createErr } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (createErr) throw createErr

    // Profile row is created by the handle_new_user trigger — update it to staff role.
    const { error: profileErr } = await serviceClient
      .from('profiles')
      .update({ role: 'staff', account_status: 'approved', approved: true, full_name: fullName })
      .eq('id', created.user.id)
    if (profileErr) throw profileErr

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
