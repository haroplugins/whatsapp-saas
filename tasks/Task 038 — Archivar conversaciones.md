# Task 038 — Archivar conversaciones

## Objetivo
Permitir archivar conversaciones para limpiar la bandeja principal sin eliminar datos.

---

## Contexto

- El inbox ya tiene conversaciones mock.
- Cada conversación tiene estado:
  - pending
  - done
- Ya existen filtros:
  - Todas
  - Pendientes
  - Atendidas
- Ya existe menú contextual en cada conversación.
- Ya existe eliminación con confirmación.
- Todo sigue siendo frontend-only con localStorage.

---

## Requisitos

### 1. Añadir propiedad archived

Cada conversación debe poder tener:

```ts
archived: boolean

Default:

archived: false
2. Acción en menú contextual

Añadir al menú ...:

Archivar conversación

Si la conversación ya está archivada:

Desarchivar conversación
3. Filtro Archivadas

Añadir un nuevo filtro:

Archivadas (X)

Quedaría:

Todas
Pendientes
Atendidas
Archivadas
4. Comportamiento de filtros
Todas: solo conversaciones no archivadas
Pendientes: no archivadas + pending
Atendidas: no archivadas + done
Archivadas: solo archived = true
5. Al archivar
la conversación desaparece de Todas/Pendientes/Atendidas
aparece en Archivadas
no se borra
conserva mensajes y notas
6. Si entra nuevo mensaje del cliente en una archivada

Si se simula mensaje de cliente en conversación archivada:

archived pasa a false
status pasa a pending
vuelve a la bandeja principal
7. Persistencia

Guardar archived en localStorage junto a la conversación.

Importante
no backend
no API
no romper eliminación
no romper estados
no romper notas
no romper automations
no romper resize
no romper filtros actuales
Resultado esperado

El usuario puede:

archivar una conversación
verla en Archivadas
desarchivarla
conservar sus notas y mensajes
si el cliente vuelve a escribir, vuelve a Pendientes