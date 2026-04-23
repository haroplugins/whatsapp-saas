# Task 030 — Motor de control de respuestas (v1)

## Objetivo
Evitar respuestas automáticas innecesarias y hacer que el sistema parezca más inteligente, controlando cuándo debe responder y cuándo no.

---

## Contexto

- Ya existen automations conectadas al inbox
- El sistema responde automáticamente siempre que entra un mensaje
- Esto genera comportamiento poco realista

---

## Problema actual

- responde SIEMPRE
- no distingue contexto
- puede parecer robótico

---

## Objetivo de esta versión

Implementar reglas simples pero efectivas:

- responder solo en primer contacto
- no responder si el usuario ya ha intervenido
- evitar duplicados
- mantener lógica simple

---

## Reglas a implementar

### 1. Solo primer mensaje de conversación

El sistema solo debe responder automáticamente si:

- es el primer mensaje de la conversación
- o la conversación no ha tenido respuesta automática previa

---

### 2. No responder si el usuario ya ha respondido

Si el usuario ha enviado un mensaje manual en esa conversación:

👉 no enviar respuesta automática

---

### 3. Evitar múltiples respuestas seguidas

Si ya se ha enviado una respuesta automática recientemente:

👉 no volver a enviar otra inmediatamente

---

### 4. Mantener prioridad de automations

Seguir usando:

1. off_hours
2. welcome

---

### 5. Guardar estado mínimo por conversación

Añadir flags simples en cada conversación:

Ejemplo:


hasAutoReplied: boolean
hasUserReplied: boolean
lastAutoReplyAt: timestamp


---

### 6. Comportamiento esperado

Caso 1:
- cliente escribe por primera vez
→ sistema responde

Caso 2:
- cliente escribe otra vez
→ sistema NO responde

Caso 3:
- usuario responde manualmente
→ sistema ya no interviene

---

## Importante

- no backend
- no IA
- no lógica compleja
- solo control básico

---

## Resultado esperado

El sistema:
- responde una vez
- deja de intervenir
- parece más natural