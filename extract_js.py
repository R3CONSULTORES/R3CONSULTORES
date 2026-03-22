import re

with open("index.html", "r") as f:
    content = f.read()

# Find the first script tag that contains our logic (Mobile menu, etc)
# It starts around line 457.
# We have a second script tag around line 660. (Supabase logic)

script1_start = content.find("<script>\n        // Mobile menu toggle")
script1_end = content.find("</script>\n</body>")

script2_start = content.find("<!-- ========== SUPABASE & CHATBOT LOGIC ========== -->\n    <script>")
script2_end = content.rfind("</script>\n\n</body>")

if script1_start != -1 and script1_end != -1 and script2_start != -1 and script2_end != -1:
    js_content1 = content[script1_start + 8:script1_end]
    js_content2 = content[script2_start + 70:script2_end]
    
    with open("app.js", "w") as f:
        f.write("/**\n * R3 Consultores - Lógica Frontend\n * Menú, Scroll, Supabase y Agente de IA\n */\n\n")
        f.write(js_content1.strip() + "\n\n")
        f.write(js_content2.strip() + "\n")
        
    # Replace scripts in index.html with a single <script src="app.js"></script>
    new_content = content[:script1_start] + '\n    <script src="app.js"></script>\n</body>'
    # Wait, the second script is after the first one, but before </body>
    # Let's just remove the first script block, and replace the second block with the src link.
    
    # Actually, let's do it cleanly:
    c2 = content[:script1_start] + content[script1_end+9:]
    s2_start_new = c2.find("<!-- ========== SUPABASE & CHATBOT LOGIC ========== -->\n    <script>")
    s2_end_new = c2.find("</script>\n\n</body>")
    
    if s2_start_new != -1 and s2_end_new != -1:
        c3 = c2[:s2_start_new] + '<!-- ========== MAIN APP LOGIC ========== -->\n    <script src="app.js"></script>' + c2[s2_end_new+9:]
        
        with open("index.html", "w") as f:
            f.write(c3)
        print("Successfully extracted JS to app.js")
    else:
        print("Failed to replace second script block")
else:
    print("Could not find script blocks")
    print(script1_start, script1_end, script2_start, script2_end)

