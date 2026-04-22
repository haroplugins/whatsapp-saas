# Task 009 — Business Flag + Conversation Filtering

## Objetivo
Permitir marcar conversaciones como negocio o personal y filtrar el inbox.

---

## Requisitos

### 1. Endpoint actualizar isBusiness

PATCH /conversations/:id/business

Body:
{
  "isBusiness": true
}

---

### 2. Seguridad

- validar tenant
- no permitir modificar conversaciones de otro tenant

---

### 3. Endpoint filtrado

GET /conversations?type=business
GET /conversations?type=personal

---

### 4. Lógica

- business → isBusiness = true
- personal → isBusiness = false

---

### 5. Validación

- query param opcional
- si no se pasa → devolver todas

---

## Importante

- no frontend
- no automatizaciones
- no lógica compleja

---

## Resultado esperado

- conversaciones clasificables
- filtro funcional
- base para separar uso personal y negocio