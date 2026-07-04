const url = 'https://histmxbmlretygakfydi.supabase.co/rest/v1/leaderboard?select=id&limit=1';
const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpc3RteGJtbHJldHlnYWtmeWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Njk5OTQsImV4cCI6MjA5ODI0NTk5NH0.2cAXKVSrb36YT2uz6xa0jpgkkOwakMpf5ngvZ5xnF7Y';

async function test() {
  try {
    const res = await fetch(url, { headers: { apikey, Authorization: `Bearer ${apikey}` } });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ Supabase connectée - Table leaderboard accessible');
      console.log('Données:', JSON.stringify(data));
    } else {
      console.log('❌ Erreur Supabase:', data.message || JSON.stringify(data));
      console.log('   → Exécutez fix_rls.sql dans SQL Editor');
    }
  } catch (err) {
    console.log('❌ Impossible de se connecter à Supabase:', err.message);
  }
}
test();