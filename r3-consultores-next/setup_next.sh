#!/bin/bash
cd /Users/juancamilo/Documents/r3-consultores-next

# Add use client
sed -i '' '1i\
"use client";\
' src/components/Navbar.jsx

sed -i '' "s/import { Link } from 'react-router-dom';/import Link from 'next\\/link';/" src/components/Navbar.jsx
sed -i '' 's/Link to=/Link href=/g' src/components/Navbar.jsx
sed -i '' 's/className="hidden lg:inline-flex/className="hidden lg:flex items-center justify-center/' src/components/Navbar.jsx

sed -i '' '1i\
"use client";\
' src/components/HeroSection.jsx

sed -i '' '1i\
"use client";\
' src/components/AppointmentForm.jsx

sed -i '' '1i\
"use client";\
' src/hooks/useAIAgent.js
sed -i '' "s|import { supabase, isSimulated } from '../lib/supabase';|import { supabase } from '../utils/supabase/client';\nconst isSimulated = false;|" src/hooks/useAIAgent.js

sed -i '' "s/import React from 'react';//" src/components/ServicesGrid.jsx
sed -i '' "s/import React from 'react';//" src/components/Footer.jsx

# Update Package.json to Next 14 + Tailwind v3 for stability
cat << 'EOF' > package.json
{
  "name": "r3-consultores-next",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.40.0",
    "lucide-react": "^0.360.0",
    "next": "14.2.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17",
    "eslint": "^8"
  }
}
EOF

# Reset tailwind config to v3 compatible
cat << 'EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'r3-gold': '#f6b034',
        'r3-slate': '#1e293b',
        'r3-bg': '#f8fafc',
        'r3-text': '#111827',
        'r3-muted': '#64748b'
      },
      fontFamily: {
        'jakarta': ['var(--font-jakarta)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
EOF

# Install the updated deps properly
/Users/juancamilo/.nvm/versions/node/v20.20.1/bin/npm install
