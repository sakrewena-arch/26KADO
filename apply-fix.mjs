import { readFileSync } from 'fs';

const sql = readFileSync('fix_rls_recursion.sql', 'utf8');

const res = await fetch('https://histmxbmlretygakfydi.supabase.co/rest/v1/rpc/exec_sql', {
  method: 'POST',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpc3RteGJtbHJldHlnYWtmeWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Njk5OTQsImV4cCI6MjA5ODI0NTk5NH0.2cAXKVSrb36YT2uz6xa0jpgkkOwakMpf5ngvZ5xnF7Y',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
});

const txt = await res.text();
console.log('Status:', res.status);
console.log('Réponse:', txt);

if (res.ok) {
  console.log('✅ Fix RLS appliqué avec succès !');
  console.log('🔄 Rafraîchissez http://localhost:3000');
} else {
  console.log('❌ Erreur:', txt);
}