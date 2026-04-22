# Task 017 — Dashboard Data (Frontend Support)

## Objetivo
Crear endpoints que permitan mostrar datos clave en el dashboard.

---

## Requisitos

### 1. Conversations resumen

GET /dashboard/conversations

Debe devolver:
- total conversaciones
- total business
- total personal

---

### 2. Messages resumen

GET /dashboard/messages

Debe devolver:
- total mensajes
- mensajes enviados por usuario
- mensajes de clientes

---

### 3. Automations resumen

GET /dashboard/automations

Debe devolver:
- total automatizaciones
- activas
- inactivas

---

### 4. Seguridad

- validar tenant
- datos solo del tenant

---

### 5. Implementación

Crear módulo:

dashboard/

---

## Importante

- queries simples
- no optimización extrema
- no lógica compleja

---

## Resultado esperado

datos listos para UI