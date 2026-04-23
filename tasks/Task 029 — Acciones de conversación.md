# Task 029 — Acciones de conversación: eliminar con confirmación

## Objetivo
Añadir acciones básicas sobre cada conversación del inbox mock, empezando por eliminar conversación con confirmación explícita.

---

## Contexto

- El inbox mock ya funciona.
- Las conversaciones se guardan en localStorage.
- Las notas privadas se guardan por conversación en localStorage.
- Todavía no hay WhatsApp real.
- El borrado debe afectar solo a la bandeja local/mock de la app.

---

## Requisitos

### 1. Añadir una X visible en cada conversación

En la lista izquierda de conversaciones:
- añadir una X o botón pequeño de eliminar
- debe estar visible pero no molestar
- no debe abrir la conversación al pulsarla

---

### 2. Añadir panel contextual simple

En cada conversación añadir también una acción contextual mínima, por ejemplo:
- botón de tres puntos
- menú simple
- opción: “Eliminar conversación”

De momento puede tener la misma acción que la X.

---

### 3. Confirmación mediante modal

Al pulsar la X o “Eliminar conversación”:
- abrir modal de confirmación
- texto claro:
  - “¿Eliminar esta conversación?”
  - “Esto solo eliminará la conversación de esta bandeja de prueba.”
- botones:
  - “Cancelar”
  - “Eliminar”

---

### 4. Acción de borrado

Si confirma:
- eliminar conversación del estado
- eliminar conversación de localStorage
- eliminar nota privada asociada a esa conversación
- si era la conversación activa:
  - seleccionar otra si existe
  - o dejar estado vacío

---

### 5. No tocar WhatsApp real

No mencionar que se borra en WhatsApp.
No simular borrado externo.
Solo local/mock.

---

## Importante

- no backend
- no API
- no librerías nuevas
- no romper notas privadas
- no romper respuestas automáticas
- no romper simulación de mensajes

---

## Resultado esperado

El usuario puede:
- crear conversaciones mock
- eliminar una conversación con X
- eliminarla también desde menú contextual
- confirmar en modal
- ver que desaparece
- comprobar que su nota asociada también desaparece