# Task 045 — OFF_hours con zona horaria

## Objetivo
Hacer que la automatización de "Fuera de horario" funcione en base al horario real del negocio y su zona horaria, no en base al navegador.

---

## Contexto

- Ya existe automation OFF_hours.
- Actualmente es simplificada (no real).
- El sistema ya recibe mensajes externos.
- Las automations ya se ejecutan.

---

## Requisitos

### 1. Modelo de horario

Guardar configuración del negocio en localStorage:

```ts
BusinessHours {
  timezone: string // ej: "Europe/Madrid"
  days: number[]   // 0–6 (domingo a sábado)
  start: string    // "09:00"
  end: string      // "18:00"
}
2. Valor por defecto

Si no hay configuración:

timezone: "Europe/Madrid"
days: [1,2,3,4,5]
start: "09:00"
end: "18:00"
3. Cálculo de hora actual

Usar:

new Date().toLocaleString("en-US", { timeZone })

o equivalente para obtener:

hora actual en esa zona
día de la semana
4. Función clave

Crear helper:

isOutsideBusinessHours(now, config)

Debe devolver:

true → fuera de horario
false → dentro de horario

Reglas:

si día no está en config.days → fuera de horario
si hora < start → fuera de horario
si hora > end → fuera de horario
5. Integración con OFF_hours

En la lógica de automations:

Reemplazar condición actual por:

if (isOutsideBusinessHours(...)) {
  ejecutar OFF_hours
}
6. No romper
welcome automation
prioridad OFF_hours > welcome
delay
typing
cancelación por respuesta manual
webhook simulado
inbox
notas
archivado
7. UI (mínima)

En /automations → OFF_hours:

Añadir campos simples:

select timezone (puede ser input texto inicialmente)
hora inicio
hora fin
días (checkbox o simplificado)

No hace falta diseño perfecto.

Resultado esperado
OFF_hours responde solo fuera del horario configurado
funciona con webhook simulado
funciona con mensajes normales
no depende de la hora del navegador