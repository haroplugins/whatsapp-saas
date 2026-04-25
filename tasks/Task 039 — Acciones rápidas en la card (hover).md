# Task 039 — Acciones rápidas en la card (hover)

## Objetivo
Permitir ejecutar acciones comunes directamente desde la card de conversación sin abrir el menú contextual.

---

## Contexto

- Ya existe menú contextual con:
  - Marcar como pendiente
  - Marcar como atendida
  - Archivar / Desarchivar
  - Eliminar
- Las acciones funcionan correctamente.
- Queremos hacer el uso más rápido.

---

## Requisitos

### 1. Acciones visibles en hover

Cuando el usuario pasa el ratón por una conversación:

Mostrar acciones rápidas en la card:

- ✔️ Marcar como atendida (si está pendiente)
- ⏳ Marcar como pendiente (si está atendida)
- 📥 Archivar (si no está archivada)
- 📤 Desarchivar (si está archivada)

---

### 2. Comportamiento

- acciones solo visibles en hover
- no visibles por defecto (mantener UI limpia)
- transición suave (fade o similar)

---

### 3. Ubicación

- lado derecho de la card (donde ya están X y ...)
- integradas visualmente
- no romper layout

---

### 4. Condicionales

- no mostrar acción redundante:
  - si ya está pendiente → no mostrar "marcar pendiente"
  - si ya está atendida → no mostrar "marcar atendida"

---

### 5. Tooltips

Cada acción debe tener tooltip:

- Marcar como atendida → "Marcar como atendida"
- Marcar como pendiente → "Marcar como pendiente"
- Archivar → "Archivar conversación"
- Desarchivar → "Desarchivar conversación"

---

### 6. Mantener menú contextual

- el menú `...` sigue existiendo
- no eliminarlo

---

### 7. No romper

- eliminación con confirmación
- filtros
- estados
- notas
- automations
- resize paneles
- layout

---

## Importante

- no backend
- no lógica nueva
- reutilizar funciones existentes
- no añadir librerías

---

## Resultado esperado

El usuario puede:

- gestionar conversaciones más rápido
- evitar abrir el menú para acciones comunes
- trabajar de forma más fluida