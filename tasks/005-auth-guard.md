# Task 005 — Auth Guard + Current User Context

## Objetivo
Proteger endpoints y poder acceder al usuario autenticado y su tenant en cada request.

---

## Requisitos

### 1. Auth Guard
- Crear guard basado en JWT
- Validar token en cada request protegido
- Rechazar requests sin token válido

---

### 2. Current User Decorator
- Crear decorador para obtener usuario desde request
- Debe devolver:
  - userId
  - tenantId

---

### 3. Integración JWT
- Validar token correctamente
- Extraer payload
- Inyectarlo en request

---

### 4. Endpoint protegido de prueba
Crear un endpoint:

GET /auth/me

Debe devolver:
- userId
- tenantId
- email

---

### 5. Estructura limpia
- auth guard en auth/
- decorador separado
- sin lógica innecesaria

---

## Importante

- no añadir roles aún
- no permisos complejos
- no tocar frontend
- no añadir lógica de negocio

---

## Resultado esperado

- endpoints protegidos funcionando
- acceso a usuario autenticado
- base para multi-tenant real