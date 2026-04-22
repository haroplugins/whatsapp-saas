# Task 008 — Conversation Status System (Pipeline Core)

## Objetivo
Convertir las conversaciones en un sistema de estados controlado para gestionar ventas.

---

## Requisitos

### 1. ENUM en Prisma

Crear enum ConversationStatus:

- NEW
- INTERESTED
- QUOTE_SENT
- PENDING
- CLOSED
- LOST

Actualizar modelo Conversation:
- status debe usar este enum

---

### 2. Migración

- generar migración nueva
- convertir datos existentes si hace falta

---

### 3. Endpoint actualizar estado

Crear endpoint:

PATCH /conversations/:id/status

Body:
{
  "status": "INTERESTED"
}

---

### 4. Seguridad

- validar tenant
- no permitir modificar conversaciones de otro tenant

---

### 5. Validación

- solo permitir valores del enum
- usar DTO con class-validator

---

## Importante

- no automatizaciones aún
- no IA
- no lógica compleja

---

## Resultado esperado

- status controlado por enum
- endpoint funcional
- base para pipeline de ventas