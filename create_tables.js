import fs from 'fs';

async function createTables() {
  const sql = fs.readFileSync('supabase_setup.sql', 'utf8');
  
  const token = 'sbp_f5f7f22d6a71ed3d6a9854976ce09269896095eb';
  const ref = 'reabgfqqamcefhsgylyd';
  
  console.log('Posting SQL to Supabase Management API...');
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  const data = await res.text();
  console.log(res.status, data);
}

createTables();
