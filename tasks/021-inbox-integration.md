# Task 021 — Inbox Integration (Core UI)

## Objetivo
Mostrar conversaciones reales en el frontend y permitir ver mensajes.

---

## Requisitos

### 1. Lista de conversaciones

En /inbox:

- llamar a GET /conversations
- mostrar lista

Cada item:
- phone
- name
- status
- badge business/personal

---

### 2. Selección

Al hacer click:
- seleccionar conversación
- mostrar panel derecho

---

### 3. Mensajes

Llamar a:

GET /conversations/:id/messages

Mostrar:
- sender (user/client)
- content
- orden cronológico

---

### 4. UI

Layout tipo:

[ lista izquierda ] [ chat derecha ]

---

### 5. Token

usar apiFetch

---

## Importante

- no enviar mensajes aún
- no websockets
- mantener simple

---

## Resultado esperado

inbox funcional