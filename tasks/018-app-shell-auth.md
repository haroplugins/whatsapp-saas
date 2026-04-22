# Task 018 — App Shell + Auth Pages (Frontend Start)

## Objetivo
Empezar la app privada (`apps/app`) con la estructura base visual y las páginas de autenticación.

---

## Requisitos

### 1. Layout base de app
Crear estructura visual mínima en apps/app:

- layout general
- sidebar simple
- header simple
- zona de contenido principal

No hace falta conectar datos reales aún.

---

### 2. Rutas iniciales
Crear estas rutas:

- /login
- /register
- /dashboard

---

### 3. UI
Diseño limpio, moderno y simple.

Usar:
- Next.js App Router
- TypeScript
- CSS ya existente del proyecto
- sin librerías visuales extra salvo necesidad clara

---

### 4. Login page
Formulario con:
- email
- password
- botón login

De momento puede dejar preparada la llamada al backend, aunque no hace falta cerrar integración completa si complica demasiado en este bloque.

---

### 5. Register page
Formulario con:
- fullName
- email
- password
- botón register

---

### 6. Dashboard page
Pantalla base con:
- título
- 3 tarjetas vacías o mock:
  - conversaciones
  - mensajes
  - automatizaciones

Preparada para conectar luego con los endpoints reales.

---

### 7. Shell visual
En rutas autenticadas, mostrar:
- sidebar izquierda
- link a dashboard
- link a inbox
- link a automations

Aunque inbox y automations todavía no existan del todo, dejar la navegación preparada.

---

## Importante

- no montar todavía integración completa de auth persistente
- no montar todavía guards frontend complejos
- no traer librerías innecesarias
- priorizar estructura limpia y diseño usable

---

## Resultado esperado

- app privada ya tiene forma real
- rutas base visibles
- login/register/dashboard listos para seguir