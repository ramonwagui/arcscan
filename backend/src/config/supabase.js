const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    console.warn('⚠️  Supabase não configurado ou usando valores padrão. Usando mock mode.');
}

const supabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')
    ? createClient(supabaseUrl, supabaseKey)
    : null;

module.exports = supabase;
