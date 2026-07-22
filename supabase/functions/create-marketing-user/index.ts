import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Not authenticated')

    // Verify caller is an admin
    const { data: { user: caller }, error: authErr } = await serviceClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !caller?.email) throw new Error('Not authenticated')

    const { data: adminRow } = await serviceClient
      .from('admin_users')
      .select('email')
      .eq('email', caller.email)
      .single()
    if (!adminRow) throw new Error('Admin access required')

    const { email, password, full_name } = await req.json()
    if (!email || !password) throw new Error('Email and password are required')
    if (password.length < 8) throw new Error('Password must be at least 8 characters')

    // Create auth user — email pre-confirmed, no confirmation email sent
    const { data: created, error: createErr } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '' },
    })
    if (createErr) throw createErr

    // Profile row is created by the handle_new_user trigger — update it to marketing role
    const { error: profileErr } = await serviceClient
      .from('profiles')
      .update({ role: 'marketing', approved: true, full_name: full_name || '' })
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
