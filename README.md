# Recupera Convivencia — Prototipo

Demo interactiva del asistente de casos de convivencia escolar. Motor de reglas basado en la
Ley 21.809 y el marco normativo chileno vigente. Todos los datos son de ejemplo y viven solo en
memoria del navegador (no hay base de datos ni envío real de correos).

## Cómo verlo en tu navegador

Necesitas tener [Node.js](https://nodejs.org) instalado (versión 18 o superior).

1. Descomprime este zip y abre una terminal en la carpeta `recupera-convivencia-web`.
2. Instala las dependencias:

   ```
   npm install
   ```

3. Levanta el servidor de desarrollo:

   ```
   npm run dev
   ```

4. Se abrirá automáticamente en `http://localhost:5173`. Si no se abre solo, entra tú a esa
   dirección desde tu navegador.

## Qué puedes probar

- **Cambiar de rol** (botón arriba a la derecha): Coordinador de Convivencia, Director/a,
  Sostenedor, Superintendencia, Docente/UTP/Inspector, Apoderado/a. Cada rol ve una versión
  distinta de la plataforma.
- **Ingresar un caso nuevo**: selecciona un tipo de situación y verás el paso a paso legal
  generarse automáticamente, con plazos y citas normativas.
- **Marcar pasos como completados** y ver cómo cambian los plazos y alertas.
- **Notificar al apoderado**: genera una vista previa del correo (simulada).
- **Panel de auditoría**: como Director, Sostenedor o Superintendencia, revisa el estado de
  cumplimiento de todos los casos.

## Siguiente paso hacia producción

Este prototipo es solo la capa visual e interactiva. Para un sistema real en un colegio se
necesita, como mínimo:

- Backend con base de datos (casos, usuarios, roles, adjuntos).
- Autenticación real por establecimiento y por rol.
- Envío real de correos (y idealmente notificaciones push).
- Validación legal formal de la matriz de plazos por un abogado educacional, dado que la
  Ley 21.809 recién entró en régimen (julio 2026) y los establecimientos tienen hasta 9 meses
  para ajustar sus reglamentos internos.
- Resguardo de datos personales de menores conforme a la Ley de Protección de Datos Personales.
