# Task 033 — Horario en OFF_hours (v1)

## Objetivo
Permitir al usuario definir su horario de disponibilidad y hacer que la automation “Fuera de horario” solo se active cuando esté realmente fuera de ese horario.

---

## Contexto

- Ya existe automation OFF_hours
- Actualmente se activa siempre que está ON
- No hay noción de horario todavía
- No hay backend

---

## Objetivo UX

El usuario debe poder decir:

👉 “Estoy disponible de X a Y estos días”

Y el sistema actuar en consecuencia.

---

## Requisitos

### 1. Añadir configuración de horario en OFF_hours

Dentro del modal de “Fuera de horario” añadir:

#### Días de trabajo
- checkboxes:
  - Lunes
  - Martes
  - Miércoles
  - Jueves
  - Viernes
  - Sábado
  - Domingo

---

#### Horario diario
- campo hora inicio (HH:mm)
- campo hora fin (HH:mm)

Ejemplo:
- inicio: 09:00
- fin: 18:00

---

### 2. Persistencia

Guardar en localStorage junto a la automation:


off_hours: {
enabled: boolean,
message: string,
schedule: {
days: number[], // 0–6
start: string, // "09:00"
end: string // "18:00"
}
}


---

### 3. Lógica de activación

OFF_hours solo se aplica si:

- está enabled
- Y el momento actual está FUERA del horario configurado

---

### 4. Cálculo básico

- obtener día actual
- comprobar si está dentro de days
- comparar hora actual con start/end

Casos:

#### Dentro de horario
👉 NO responder OFF_hours

#### Fuera de horario
👉 SÍ responder OFF_hours

---

### 5. Default seguro

Si el usuario no configura nada:

👉 OFF_hours funciona como ahora (si está ON, responde siempre)

---

### 6. No romper nada

- mantener prioridad con welcome
- mantener lógica de respuestas
- mantener delay
- mantener control de respuestas (Task 030)

---

## Importante

- no backend
- no timezone complejo (usar local del navegador)
- no edge cases avanzados aún

---

## Resultado esperado

Usuario:
- configura horario
- simula mensaje

Sistema:
- responde solo fuera del horario
- se comporta como asistente real