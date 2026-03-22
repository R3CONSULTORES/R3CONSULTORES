with open("index.html", "r") as f:
    lines = f.readlines()

# The first custom script starts at line 448
script1_start = -1
script1_end = -1
script2_start = -1
script2_end = -1

for i, line in enumerate(lines):
    if "<!-- ========== SUPABASE & CHATBOT LOGIC ========== -->" in line:
        script2_start = i + 1
    if "</body>" in line:
        script2_end = i - 1

# Finding the first script block manually based on content (e.g., "// Mobile menu toggle")
for i, line in enumerate(lines):
    if "// Mobile menu toggle" in line:
        script1_start = i - 2
        for j in range(i, len(lines)):
            if "</script>" in lines[j]:
                script1_end = j
                break
        break

if script1_start != -1 and script1_end != -1 and script2_start != -1 and script2_end != -1:
    js1 = "".join(lines[script1_start+1:script1_end])
    js2 = "".join(lines[script2_start+1:script2_end])
    
    with open("app.js", "w") as f:
        f.write("/**\n * R3 Consultores - Lógica Frontend\n * Menú, Scroll, Supabase y Agente de IA\n */\n\n")
        f.write(js1)
        f.write("\n\n")
        f.write(js2)
        
    part1 = lines[:script1_start]
    part2 = lines[script1_end+1:script2_start-1]
    part3 = lines[script2_end+2:]
    
    with open("index.html", "w") as f:
        for line in part1:
            f.write(line)
        for line in part2:
            f.write(line)
        f.write('    <!-- ========== MAIN APP LOGIC ========== -->\n')
        f.write('    <script src="app.js"></script>\n')
        for line in part3:
            f.write(line)
    print("Success")
else:
    print(f"Failed: s1_start={script1_start}, s1_end={script1_end}, s2_start={script2_start}, s2_end={script2_end}")

