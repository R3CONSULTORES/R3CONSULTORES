---
description: Desplegar cambios verificados a Vercel (Producción)
---
Esta es la acción oficial para sincronizar el código local con el entorno de producción en Vercel.

*IMPORTANTE: Solo debe ejecutarse cuando el usuario lo solicite expresamente ("Sube esto a producción", "Haz el despliegue", etc.) tras haber validado el funcionamiento en localhost.*

Paso a paso:

// turbo-all
1. Desplegar directamente a Vercel con la opción --prod (NO usar GitHub, NO hacer git push).
```bash
npx vercel --prod
```
2. Notificar al usuario que los cambios se verán reflejados inmediatamente en r3consultores.com.

> ⚠️ NUNCA hacer git push ni deploy via GitHub. El deploy siempre es directo con `npx vercel --prod`.
