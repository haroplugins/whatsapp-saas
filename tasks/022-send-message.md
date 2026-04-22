# Task 022 — Send Message (Frontend + Backend)

## Objetivo
Permitir enviar mensajes desde el frontend.

---

## Requisitos

### 1. Backend endpoint

POST /conversations/:id/messages

Body:
{
  "content": "texto"
}

Debe:
- crear mensaje
- sender = USER
- validar tenant

---

### 2. Frontend

En /inbox:

- input texto abajo
- botón enviar

---

### 3. Comportamiento

- enviar mensaje
- refrescar lista
- mostrar en chat

---

### 4. UX

- limpiar input tras enviar
- scroll al último mensaje

---

### 5. Token

usar apiFetch

---

## Importante

- no websockets aún
- no optimización
- mantener simple

---

## Resultado esperado

usuario puede responder mensajes