# Task 002 — Database + Prisma Base Setup

## Objetivo
Añadir la base de datos al proyecto usando Prisma en la API (`apps/api`) y dejar preparada la base para seguir construyendo auth y multi-tenant.

---

## Requisitos

### 1. Instalar y configurar Prisma en `apps/api`
- Añadir dependencias necesarias de Prisma
- Inicializar Prisma
- Usar PostgreSQL
- Leer la conexión desde variable de entorno `DATABASE_URL`

---

### 2. Crear estructura base de Prisma
Quiero que Prisma viva dentro de `apps/api`.

Debe quedar una estructura limpia y profesional.

---

### 3. Crear esquema inicial de base de datos
Definir estas tablas/modelos mínimos:

#### Tenant
- id
- name
- createdAt
- updatedAt

#### User
- id
- tenantId
- email
- passwordHash
- fullName
- createdAt
- updatedAt

Relación:
- un tenant tiene muchos users
- un user pertenece a un tenant

---

### 4. Generar primera migración
- Crear migración inicial de Prisma
- No inventar más tablas todavía
- No añadir lógica de negocio

---

### 5. Cliente Prisma reutilizable
Crear una forma limpia de reutilizar Prisma dentro de NestJS.

Objetivo:
- dejar preparada la integración para servicios futuros

---

### 6. Variables de entorno
Asegurar que `apps/api` lee correctamente `DATABASE_URL`

Si hace falta, adaptar `.env` o carga de configuración, pero sin romper el monorepo.

---

## Importante

- No implementar auth todavía
- No implementar endpoints de negocio
- No crear tablas extra
- Mantener todo tipado y limpio
- Seguir estructura preparada para multi-tenant

---

## Resultado esperado

Quiero que al terminar:
- Prisma esté instalado y configurado en `apps/api`
- exista el esquema base con `Tenant` y `User`
- exista la primera migración
- NestJS pueda usar Prisma correctamente
- todo compile sin errores