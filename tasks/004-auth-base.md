# Task 004 — Auth Base (NestJS + Prisma)

## Objetivo
Implementar un sistema base de autenticación en apps/api usando Prisma como fuente de datos.

---

## Requisitos

### 1. Registro de usuario
- Crear endpoint para registro
- Crear Tenant automáticamente
- Crear User asociado al Tenant
- Hashear password

---

### 2. Login
- Validar email + password
- Generar JWT
- No refresh tokens todavía

---

### 3. Seguridad
- Usar bcrypt para hash
- Nunca guardar password en claro

---

### 4. JWT
- Añadir módulo JWT en NestJS
- Token debe incluir:
  - userId
  - tenantId

---

### 5. Estructura

Crear módulos:

- auth/
- users/

Mantener código limpio y desacoplado

---

### 6. Prisma usage
- Usar PrismaService
- No duplicar lógica

---

## Importante

- No frontend todavía
- No roles avanzados
- No permisos complejos
- No endpoints innecesarios

---

## Resultado esperado

- registro funcionando
- login funcionando
- JWT generado correctamente
- integración limpia con Prisma