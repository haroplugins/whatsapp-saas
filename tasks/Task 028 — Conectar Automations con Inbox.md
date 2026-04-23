# Task 028 — Conectar Automations con Inbox (v1)

## Objetivo
Hacer que las automatizaciones configuradas en /automations tengan efecto real en el inbox mock, generando respuestas automáticas cuando entra un mensaje.

---

## Contexto

- Inbox mock ya funciona (simulación + respuestas manuales)
- Automations UI ya existe
- Automations se guardan en localStorage
- No hay backend
- No hay IA aún

---

## Comportamiento esperado

Cuando el usuario pulsa:
- “Simular mensaje entrante”

El sistema debe:

1. Crear mensaje del cliente
2. Evaluar automations activas
3. Si corresponde → enviar respuesta automática

---

## Lógica (simple)

Prioridad:

1. OFF_hours (si está activa)
2. welcome (si está activa)

Ejemplo:


if off_hours.enabled:
responder con off_hours.message
else if welcome.enabled:
responder con welcome.message


---

## Requisitos

### 1. Leer automations desde localStorage

Usar estructura existente:


automations = {
welcome: { enabled: boolean, message: string },
off_hours: { enabled: boolean, message: string }
}


---

### 2. Al simular mensaje entrante

Después de crear el mensaje del cliente:

- comprobar automations
- si alguna aplica:
  - añadir mensaje automático del sistema

---

### 3. Delay (MUY IMPORTANTE para UX)

No responder instantáneamente.

Añadir pequeño delay:
- 500ms – 1200ms

Simula comportamiento real

---

### 4. Tipo de mensaje

Diferenciar claramente:

- cliente
- usuario
- sistema (automático)

Puede ser:
- alineación diferente
- etiqueta pequeña tipo “Auto”

---

### 5. No duplicar respuestas

Solo responder una vez por mensaje entrante.

---

### 6. No romper nada existente

- mantener respuesta manual
- mantener notas
- mantener lista de conversaciones

---

## Resultado esperado

Flujo:

1. Usuario pulsa “Simular mensaje”
2. Aparece mensaje cliente
3. (tras pequeño delay)
4. Aparece respuesta automática

---

## Importante

- no backend
- no API
- no IA
- lógica simple
- código claro