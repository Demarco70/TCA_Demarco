const SUPABASE_URL = "https://qxsvzbscftgviujaanbn.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_hVRsxTILGjHe8-RLdm7lZA_YQ4PEzwi"

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Cliente Supabase inicializado!", supabaseClient);