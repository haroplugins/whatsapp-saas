# Task 031 — Feedback visual del sistema (v1)

## Objetivo
Hacer que las respuestas automáticas del sistema se sientan más naturales y “vivas” mediante feedback visual (typing / respondiendo) antes de enviar el mensaje.

---

## Contexto

- Ya existe auto reply con delay
- Ya existe control de cuándo responder
- Ahora mismo el mensaje aparece sin transición visible
- Falta sensación de “alguien está respondiendo”

---

## Problema

El sistema:
- responde correctamente
- pero no transmite comportamiento humano

---

## Objetivo UX

Antes de enviar la respuesta automática:

👉 mostrar que el sistema está “escribiendo”

---

## Requisitos

### 1. Estado “typing”

Cuando se activa una respuesta automática:

- mostrar indicador en el chat:
  - “Escribiendo…”
  - o animación de puntos

Debe aparecer:
- justo después del mensaje del cliente
- antes del mensaje automático

---

### 2. Duración

- visible durante el delay ya existente (500–1200ms)
- desaparecer cuando se envía el mensaje automático

---

### 3. Estilo visual

Debe diferenciarse de mensajes normales:

- no parecer mensaje real
- estilo ligero:
  - texto gris
  - puntos animados opcional

---

### 4. Ubicación

En el chat:
- como si fuera un mensaje entrante en proceso
- alineado como mensaje del sistema/cliente

---

### 5. No interferir

- no bloquear input del usuario
- no romper mensajes manuales
- no romper notas

---

## Importante

- no backend
- no librerías nuevas
- no animaciones complejas
- mantener simple

---

## Resultado esperado

Flujo:

1. Cliente envía mensaje
2. Aparece:
   “Escribiendo…”
3. (tras delay)
4. Aparece mensaje automático

---

## Impacto

Hace que el sistema:
- parezca más humano
- más natural
- más creíble