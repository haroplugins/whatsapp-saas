# Task 027 — Automations UI (v1)

## Objetivo
Crear la primera versión funcional de la pantalla de Automations como un sistema simple y visual donde el usuario pueda activar y configurar respuestas automáticas básicas.

---

## Contexto

- Ya existe navegación a /automations
- Inbox ya está funcionando en modo mock
- Notas privadas ya existen
- No hay backend para automatizaciones
- Todo debe ser frontend-only

---

## Enfoque UX

Pantalla basada en “pastillas” (cards), no en tablas ni reglas complejas.

Cada automatización:
- se entiende en 2 segundos
- se activa/desactiva fácil
- se configura en modal

---

## Requisitos

### 1. Grid de automations

Mostrar al menos 2 automatizaciones:

#### A. Respuesta automática de bienvenida
- Título: “Respuesta automática”
- Descripción: “Responde automáticamente el primer mensaje”

#### B. Mensaje fuera de horario
- Título: “Fuera de horario”
- Descripción: “Responde cuando no estás disponible”

---

### 2. Cada card debe tener

- título
- descripción corta
- toggle ON/OFF visible
- botón “Configurar”

---

### 3. Modal de configuración

Al hacer click en “Configurar”:

#### Para bienvenida
- toggle ON/OFF
- textarea:
  - mensaje automático

#### Para fuera de horario
- toggle ON/OFF
- textarea:
  - mensaje fuera de horario

(No implementar horarios aún)

---

### 4. Persistencia

Guardar en localStorage:

Estructura ejemplo:


automations = {
welcome: {
enabled: true/false,
message: string
},
off_hours: {
enabled: true/false,
message: string
}
}


Requisitos:
- persistir al recargar
- cargar estado al abrir la app

---

### 5. UX simple

- no sobrecargar
- diseño limpio
- fácil de entender
- no añadir lógica compleja

---

### 6. No backend

- no API
- no base de datos
- no IA aún

---

## Resultado esperado

El usuario:
- entra en Automations
- ve 2 opciones claras
- activa/desactiva
- configura mensaje
- cierra modal
- todo queda guardado