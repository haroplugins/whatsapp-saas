# Task 032 — Paneles redimensionables (v1)

## Objetivo
Permitir al usuario ajustar el ancho de los paneles del inbox (lista de conversaciones, chat y notas privadas) mediante drag, mejorando la experiencia de uso diario.

---

## Contexto

- El inbox ya tiene 3 columnas:
  - izquierda: conversaciones
  - centro: chat
  - derecha: notas privadas
- Actualmente los tamaños son fijos
- El usuario puede necesitar más espacio según contexto

---

## Requisitos

### 1. Añadir separadores arrastrables

Entre columnas:

- entre conversaciones y chat
- entre chat y notas

Debe haber una barra vertical o zona “drag” clara.

---

### 2. Comportamiento drag

Al arrastrar:

- modificar ancho de los paneles en tiempo real
- movimiento horizontal (mouse X)

---

### 3. Límites mínimos

Para evitar romper layout:

- conversaciones: mínimo 220px
- chat: mínimo 300px
- notas: mínimo 220px

---

### 4. Persistencia

Guardar tamaños en localStorage:

Ejemplo:


layout = {
leftWidth: number,
centerWidth: number,
rightWidth: number
}


Requisitos:
- cargar al iniciar
- mantener tras recarga

---

### 5. UX

- cursor tipo resize (col-resize)
- feedback visual claro al hover
- no saltos bruscos

---

### 6. Responsive básico

En pantallas pequeñas:
- si no cabe todo:
  - mantener comportamiento actual (no romper)
  - no hace falta solución compleja ahora

---

## Importante

- no usar librerías externas
- no rehacer layout completo
- mantener estructura existente
- no romper chat, notas, automations

---

## Resultado esperado

El usuario:
- arrastra separadores
- ajusta tamaños a su gusto
- recarga página
- mantiene su layout personalizado