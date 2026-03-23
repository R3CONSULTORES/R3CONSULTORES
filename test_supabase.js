import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://reabgfqqamcefhsgylyd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYWJnZnFxYW1jZWZoc2d5bHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDM4MjEsImV4cCI6MjA4OTcxOTgyMX0.jmtFKW_4V42GKFTCF6DI9hSp7m_vYV5zNPhYQpOjmf4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('Testing Supabase Insert...');
  const { data, error } = await supabase
    .from('clientes')
    .insert({ 
      nombre_completo: 'Test User Agent No Select', 
      email: 'testagent2@local.com', 
      telefono: '123' 
    });

  if (error) {
    console.error('INSERT ERROR:', error);
  } else {
    console.log('INSERT SUCCESS! Data:', data);
  }
}
testSupabase();
