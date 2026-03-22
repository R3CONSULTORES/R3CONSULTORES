with open("app.js", "r") as f:
    text = f.read()

# Fix the ReferenceError
text = text.replace(
    "const supabase = (typeof supabase !== 'undefined' && supabaseUrlValid)",
    "let supabaseClient = null;\n        if (typeof window.supabase !== 'undefined' && supabaseUrlValid)"
)
text = text.replace(
    "? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) \n            : null;",
    "{\n            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);\n        }"
)

# Replace remaining 'supabase.' and '!supabase' occurrences with 'supabaseClient.'
text = text.replace("if (!supabase ||", "if (!supabaseClient ||")
text = text.replace("await supabase\n", "await supabaseClient\n")

with open("app.js", "w") as f:
    f.write(text)
