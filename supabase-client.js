// Configuracao publica do Supabase.
(function configurarSupabaseCyberVoid() {
    if (window.CyberVoidSupabase) {
        return;
    }

    const supabaseUrl = 'https://uhkpjivrojrevmgkvfxp.supabase.co';
    const supabasePublishableKey = 'sb_publishable_ZkLUv4Go2iZflFeCA3HMfg_LXWjN2fe';

    if (!window.supabase || !window.supabase.createClient) {
        window.CyberVoidSupabase = null;
        return;
    }

    window.CyberVoidSupabase = window.supabase.createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            auth: {
                autoRefreshToken: true,
                detectSessionInUrl: true,
                persistSession: true
            }
        }
    );
}());
