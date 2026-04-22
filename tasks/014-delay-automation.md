# Task 014 — Delay Automations (Time-based triggers)

## Objetivo
Permitir automatizaciones que se ejecuten después de un tiempo.

---

## Requisitos

### 1. Nuevo trigger

TriggerType.TIME_DELAY

triggerValue ejemplo:
"5m"
"1h"

---

### 2. Lógica

Cuando se crea mensaje:

si hay automatización TIME_DELAY:

→ programar ejecución futura

---

### 3. Implementación simple

NO usar colas aún.

Usar:

setTimeout(...)

---

### 4. Acción

Al ejecutarse:

crear mensaje automático

---

### 5. Seguridad

- solo tenant actual
- evitar loops

---

## Importante

- solución simple
- no persistencia de jobs
- no redis aún

---

## Resultado esperado

mensaje automático tras X tiempo