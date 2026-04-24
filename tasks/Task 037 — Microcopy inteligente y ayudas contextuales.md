# Task 037 — Tooltips inteligentes (UX limpio)

## Objetivo
Añadir ayudas contextuales mediante tooltips (hover) para mejorar la comprensión sin ensuciar la interfaz.

---

## Contexto

- La UI ya está limpia y compacta.
- No queremos añadir textos visibles permanentes.
- Queremos ayuda solo cuando el usuario la necesita.

---

## Principio UX

👉 No llenar la pantalla  
👉 Mostrar ayuda solo bajo demanda  

---

## Requisitos

### 1. Tooltip en estados (Inbox)

En el badge de estado:

- Pendiente → tooltip:
  "Requiere tu atención"

- Atendida → tooltip:
  "Ya has respondido o revisado esta conversación"

---

### 2. Tooltip en automations

#### Respuesta automática
Tooltip:
"Se envía una sola vez al primer mensaje del cliente"

#### Fuera de horario
Tooltip:
"Responde cuando no estás disponible"

---

### 3. Tooltip en notas privadas

En el header o icono del panel de notas:

Tooltip:
"Solo visible para ti"

---

### 4. Implementación

- usar title nativo HTML o solución ligera
- no añadir librerías
- no crear sistema complejo de tooltips
- debe funcionar con hover

---

### 5. Estilo

- no modificar layout
- no añadir elementos visibles nuevos
- mantener UI limpia

---

## Importante

- no backend
- no lógica nueva
- no tocar estados
- no tocar automations
- no romper inbox

---

## Resultado esperado

El usuario:
- pasa el ratón
- entiende el sistema
- no ve texto innecesario