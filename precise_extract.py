with open("index.html", "r") as f:
    lines = f.readlines()

js1 = "".join(lines[448:540])
js2 = "".join(lines[586:765])

with open("app.js", "w") as f:
    f.write("/**\n * R3 Consultores - Lógica Frontend\n * Menú, Scroll, Supabase y Agente de IA\n */\n\n")
    f.write(js1)
    f.write("\n\n")
    f.write(js2)

with open("index.html", "w") as f:
    f.writelines(lines[:447])
    f.write('    <!-- ========== MAIN APP LOGIC ========== -->\n')
    f.write('    <script src="app.js"></script>\n')
    f.writelines(lines[541:585])
    f.writelines(lines[766:])

print("Successfully extracted JS")
