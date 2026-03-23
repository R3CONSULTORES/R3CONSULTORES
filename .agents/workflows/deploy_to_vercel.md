---
description: Desplegar cambios verificados a Vercel (Producción)
---
Esta es la acción oficial para sincronizar el código local con el entorno de producción en Vercel.

*IMPORTANTE: Solo debe ejecutarse cuando el usuario lo solicite expresamente ("Sube esto a producción", "Haz el despliegue", etc.) tras haber validado el funcionamiento en localhost.*

Paso a paso:

1. Guardar todos los cambios recientes.
2. Hacer el commit y subir a GitHub (para respaldo).
// turbo-all
3. Desplegar a Vercel con la opción --prod.
```bash
git add .
git commit -m "🚀 Actualización a producción (Despliegue Vercel)"
git push origin main
npx vercel --prod
```
4. Notificar al usuario que los cambios se verán reflejados inmediatamente en r3consultores.com.
