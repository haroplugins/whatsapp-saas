# Task 010 — Automations Base (Core System)

## Objetivo
Crear la base de automatizaciones que permitirá acciones automáticas sobre conversaciones.

---

## Requisitos

### 1. Modelo Prisma

Crear modelo Automation:

- id
- tenantId
- name
- triggerType (string)
- triggerValue (string)
- actionType (string)
- actionValue (string)
- isActive (boolean)
- createdAt
- updatedAt

Relación:
- pertenece a Tenant

---

### 2. Migración

- generar migración nueva
- no modificar modelos anteriores

---

### 3. Servicio NestJS

Crear AutomationsModule:

- automations.service.ts
- automations.module.ts

Funciones:

- crear automatización
- listar automatizaciones por tenant

---

### 4. Endpoint

POST /automations
GET /automations

---

### 5. Seguridad

- validar tenant
- no permitir acceso cruzado

---

## Importante

- NO ejecutar automatizaciones aún
- NO lógica compleja
- solo guardar configuración

---

## Resultado esperado

- tabla Automation creada
- endpoints funcionales
- base para motor automático futuro