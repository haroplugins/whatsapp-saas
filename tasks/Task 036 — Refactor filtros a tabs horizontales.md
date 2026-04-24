# Task 036 — Refactor filtros a tabs horizontales

## Objetivo
Transformar los filtros actuales (demasiado grandes y verticales) en un sistema de tabs horizontales compacto, limpio y profesional.

---

## Contexto

- Ya existen filtros:
  - Todas
  - Pendientes
  - Atendidas
- Actualmente tienen:
  - formato vertical
  - tamaño excesivo
  - demasiado protagonismo

---

## Problema

- roban foco a las conversaciones
- rompen el flujo visual
- no parecen filtros, parecen botones principales

---

## Objetivo UX

Convertirlos en:

👉 tabs horizontales compactos  
👉 secundarios visualmente  
👉 rápidos de usar  

---

## Requisitos

### 1. Layout horizontal

Los filtros deben mostrarse en una fila:

[Todas (X)] [Pendientes (X)] [Atendidas (X)]

Ubicación:
- justo debajo del título "Conversaciones"

---

### 2. Tamaño compacto

- altura: 32–36px
- padding reducido
- texto más pequeño que el actual

---

### 3. Estilo

#### Tab activo:
- fondo suave (verde claro)
- texto más oscuro
- opcional: borde ligero

#### Tab inactivo:
- fondo transparente
- texto neutro
- hover ligero

---

### 4. Separación

- gap entre tabs: 8–12px
- no cápsulas gigantes pegadas

---

### 5. Border radius

- pequeño (no estilo “pill grande”)
- look más tipo tabs que botones

---

### 6. Contadores

Mantener:
- Todas (X)
- Pendientes (X)
- Atendidas (X)

---

### 7. Comportamiento

- exactamente igual que ahora
- solo cambia la UI
- no tocar lógica de filtros

---

## Importante

- no romper:
  - filtros actuales
  - contadores
  - estados
  - orden
  - inbox
- no backend
- no lógica nueva

---

## Resultado esperado

- filtros discretos
- más espacio para conversaciones
- UI más profesional
- mejor jerarquía visual