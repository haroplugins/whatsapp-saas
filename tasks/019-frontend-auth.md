# Task 019 — Frontend Auth Integration

## Objetivo
Conectar login y register del frontend con el backend real.

---

## Requisitos

### 1. Login real

En /login:

- llamar a POST /auth/login
- enviar email + password
- recibir accessToken

---

### 2. Register real

En /register:

- llamar a POST /auth/register
- enviar datos
- recibir token

---

### 3. Guardar token

- usar localStorage (simple)
- clave: accessToken

---

### 4. Redirección

- login correcto → /dashboard
- register correcto → /dashboard

---

### 5. Manejo de errores

- mostrar error simple si falla login/register

---

### 6. Preparar fetch helper

Crear función:

apiFetch(url, options)

que incluya:
Authorization: Bearer token

---

## Importante

- no cookies aún
- no refresh tokens
- no guards complejos
- mantenerlo simple

---

## Resultado esperado

- login funcional real
- register funcional real
- navegación a dashboard