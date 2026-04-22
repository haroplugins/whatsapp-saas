# Task 016 — Automation Management (Improve UX)

## Objetivo
Mejorar la gestión de automatizaciones para hacer el sistema usable.

---

## Requisitos

### 1. Endpoint update

PATCH /automations/:id

Permitir editar:
- name
- triggerType
- triggerValue
- actionType
- actionValue
- isActive

---

### 2. Endpoint toggle

PATCH /automations/:id/toggle

Cambia:
isActive → true/false

---

### 3. Endpoint delete

DELETE /automations/:id

---

### 4. Seguridad

- validar tenant
- no permitir acceso cruzado

---

### 5. Validación

- DTOs con class-validator
- enums correctos

---

## Importante

- no lógica compleja
- no automatizaciones nuevas

---

## Resultado esperado

usuario puede:
- crear reglas
- editar reglas
- activar/desactivar
- borrar reglas