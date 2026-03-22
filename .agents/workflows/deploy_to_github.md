---
description: Desplegar cambios verificados a GitHub Pages
---
Esta es la acción oficial para sincronizar el código local con el repositorio de GitHub y el entorno de producción (GitHub Pages). 

*IMPORTANTE: Solo debe ejecutarse cuando el usuario lo solicite expresamente ("Sube esto a GitHub", "Haz el despliegue", etc.) tras haber validado el funcionamiento en localhost.*

Paso a paso:

1. Guardar todos los cambios recientes.
2. Hacer el commit y subir a GitHub.
// turbo-all
```bash
git add .
git commit -m "🚀 Actualización a producción (Despliegue GitHub Pages)"
git push origin main
```
3. (Opcional) Notificar al usuario que los cambios pueden tardar de 1 a 3 minutos en reflejarse en r3consultores.com.
