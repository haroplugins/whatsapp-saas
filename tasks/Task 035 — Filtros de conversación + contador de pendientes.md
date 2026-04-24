# Task 035 — Filtros de conversación + contador de pendientes

## Objetivo
Mejorar la usabilidad del inbox añadiendo filtros rápidos por estado y un contador visible de conversaciones pendientes.

---

## Contexto

- El inbox ya tiene estados:
  - pending = Pendiente
  - done = Atendida
- Las conversaciones pendientes se ordenan arriba.
- El usuario necesita encontrar rápidamente qué conversaciones requieren atención.

---

## Requisitos

### 1. Filtros rápidos

Añadir una barra de filtros en la parte superior del panel izquierdo de conversaciones:

- Todas
- Pendientes
- Atendidas

---

### 2. Contadores

Mostrar contador en cada filtro:

- Todas (X)
- Pendientes (X)
- Atendidas (X)

---

### 3. Comportamiento

- Filtro por defecto: Todas
- Al seleccionar Pendientes:
  - mostrar solo conversaciones pending
- Al seleccionar Atendidas:
  - mostrar solo conversaciones done
- No modificar estados ni datos, solo filtrar visualmente.

---

### 4. Mantener orden

Dentro del filtro activo:
- mantener orden actual:
  - pendientes arriba cuando aplica
  - actividad reciente dentro de grupos

---

### 5. UX

- filtro activo debe verse claramente
- botones compactos
- no ocupar demasiado espacio

---

## Importante

- no backend
- no API
- no IA
- no romper:
  - simulación de mensajes
  - auto replies
  - estados
  - notas
  - eliminación
  - paneles redimensionables

---

## Resultado esperado

El usuario puede:
- ver todas las conversaciones
- filtrar solo pendientes
- filtrar solo atendidas
- ver cuántas tiene en cada grupo