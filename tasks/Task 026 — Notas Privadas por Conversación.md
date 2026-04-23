# Task 026 — Notas Privadas por Conversación (v1 local)

## Objetivo
Añadir un panel derecho en el inbox para notas privadas asociadas a la conversación activa, de forma que el usuario tenga contexto útil sobre ese cliente mientras responde.

---

## Contexto

- El inbox mock ya funciona
- Hay lista izquierda de conversaciones
- Hay chat central funcional
- Aún no hay backend ni persistencia real
- Queremos una primera versión útil sin complicar arquitectura

Las notas privadas son una parte importante del valor del producto:
- recordar cosas del cliente
- apuntar contexto
- tener memoria operativa

---

## Requisitos

### 1. Añadir panel derecho de notas privadas

En la pantalla de /inbox:
- mantener estructura izquierda = conversaciones
- centro = chat
- derecha = notas privadas

El panel derecho debe estar asociado a la conversación seleccionada.

---

### 2. Mostrar estado vacío si no hay conversación seleccionada

Si no hay conversación activa:
- mostrar mensaje tipo:
  - “Selecciona una conversación para ver sus notas privadas”
o similar

---

### 3. Nota privada editable

Si hay conversación activa:
- mostrar un textarea o campo grande de texto
- permitir escribir y editar libremente

---

### 4. Persistencia simple local

Las notas deben persistirse por conversación usando `localStorage`.

Requisitos:
- cada conversación mock debe tener un id estable
- la nota debe guardarse asociada a ese id
- si cambias de conversación y vuelves, la nota debe seguir ahí
- si recargas la página, la nota debe mantenerse

---

### 5. Botón borrar nota

Añadir acción clara para:
- borrar la nota de la conversación activa

No hace falta confirmación compleja.

---

### 6. Copy y tono

Debe quedar claro que:
- es una nota privada
- no la verá el cliente

Ejemplo de ayuda:
- “Solo visible para ti”
- “Úsalo para recordar detalles importantes del cliente”

---

### 7. No backend

- no API
- no DB
- no cifrado todavía
- solo primera versión funcional en frontend

---

## Importante

- no romper onboarding
- no romper inbox actual
- no rehacer el layout completo
- no añadir librerías nuevas

---

## Resultado esperado

El usuario entra al inbox y:
- selecciona conversación
- escribe una nota privada
- cambia de conversación
- vuelve
- la nota sigue ahí
- recarga la página
- la nota sigue ahí