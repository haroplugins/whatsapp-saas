# Task 020 — Dashboard Real Data Integration

## Objetivo
Conectar el dashboard del frontend con los endpoints reales del backend.

---

## Requisitos

### 1. Conectar endpoints

GET /dashboard/conversations  
GET /dashboard/messages  
GET /dashboard/automations  

---

### 2. UI

Actualizar tarjetas del dashboard para mostrar:

- conversaciones:
  total, business, personal

- mensajes:
  total, user, client

- automatizaciones:
  total, activas, inactivas

---

### 3. Implementación

- usar apiFetch
- hacer llamadas en useEffect
- manejar loading básico

---

### 4. Token

usar accessToken ya guardado

---

## Importante

- no optimización extrema
- no SSR
- mantener simple

---

## Resultado esperado

dashboard con datos reales