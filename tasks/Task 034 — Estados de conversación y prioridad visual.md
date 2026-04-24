# Task 034 — Estados de conversación y prioridad visual

## Objetivo
Añadir estados simples a las conversaciones del inbox para que el usuario pueda distinguir rápidamente qué conversaciones requieren atención y cuáles ya están atendidas.

---

## Estados V1

Solo habrá 2 estados:

- pending → Pendiente
- done → Atendida

---

## Requisitos

### 1. Badge en cada conversación

En la lista izquierda del inbox, cada conversación debe mostrar una label pequeña:

- Pendiente
- Atendida

Debe ser visualmente clara y discreta.

---

### 2. Estado inicial

Cuando se crea una conversación nueva por “Simular mensaje entrante”:

- estado = pending

---

### 3. Auto cambio a atendida

Cuando el usuario responde manualmente en una conversación:

- estado = done inmediatamente

---

### 4. Auto cambio a pendiente con delay

Si una conversación está en estado done y entra un nuevo mensaje del cliente:

- no cambiar inmediatamente
- programar cambio a pending tras un delay de 2 minutos

Si el usuario responde manualmente antes de esos 2 minutos:

- cancelar el cambio a pending
- mantener done

Para facilitar test, usar una constante tipo:

```ts
const PENDING_DELAY_MS = 2 * 60 * 1000;
5. Reordenación de conversaciones

La lista debe ordenarse así:

conversaciones pending arriba
conversaciones done debajo
dentro de cada grupo, ordenar por actividad más reciente
6. Cambio manual desde menú contextual

En el menú ⋯ de cada conversación añadir:

Marcar como pendiente
Marcar como atendida

Debe actualizar estado y persistir.

7. Persistencia

Guardar el estado junto a la conversación en localStorage.

Importante
no backend
no API
no IA
no romper notas
no romper automations
no romper auto reply
no romper eliminación
Resultado esperado
cliente escribe → pendiente
sistema responde automático → sigue pendiente
usuario responde → atendida
cliente vuelve a escribir en conversación atendida → pendiente solo tras delay si el usuario no contesta
pendientes siempre arriba