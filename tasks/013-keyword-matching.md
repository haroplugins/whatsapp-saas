# Task 013 — Improved Keyword Matching

## Objetivo
Mejorar el sistema de detección de keywords para hacerlo más realista.

---

## Requisitos

### 1. Normalización

Antes de comparar:

- convertir a minúsculas
- eliminar tildes
- trim espacios

---

### 2. Matching flexible

Debe detectar:

"hola"
"Hola"
"hola!"
"hola, necesito info"

---

### 3. Implementación

Modificar:

messages.service.ts

---

### 4. Función util

Crear helper:

normalizeText(text: string): string

---

### 5. Seguridad

No romper lógica existente
No afectar multi-tenant

---

## Importante

- no regex complejas
- no NLP
- solo mejora simple pero robusta

---

## Resultado esperado

keyword matching más fiable