# Task 046 — Perfil del negocio

## Objetivo
Permitir configurar los datos básicos del negocio para que el sistema pueda generar respuestas coherentes y personalizadas.

---

## Contexto

- Ya existe sistema de automations (welcome, off_hours).
- Ya existe entrada de mensajes externos.
- Actualmente las respuestas son genéricas.
- Necesitamos dar contexto al sistema.

---

## Requisitos

### 1. Modelo BusinessProfile

Guardar en localStorage:

```ts
BusinessProfile {
  name: string
  service: string
  tone: "friendly" | "formal"
  baseMessage: string
}
2. Valores por defecto

Si no existe:

name: "Mi negocio"
service: "servicio general"
tone: "friendly"
baseMessage: ""
3. UI en /automations o nueva sección simple

Añadir bloque:

Nombre del negocio (input)
Tipo de servicio (input)
Tono:
Cercano
Formal
Mensaje base (textarea)
4. Integración básica

Actualizar textos de automations:

OFF_hours
welcome

Para incluir:

nombre negocio
tono
mensaje base (si existe)

Ejemplo:

Hola, soy {{name}}. Ahora mismo estamos fuera de horario...
5. No usar IA aún

Esto es solo plantilla dinámica.

6. No romper
automations existentes
webhook
inbox
notas
archivado
timezone
delays / typing
Resultado esperado

El usuario:

configura su negocio
recibe respuestas más coherentes
empieza a ver valor real