# Task 012 — Enum Hardening (System Stability)

## Objetivo
Convertir campos críticos a ENUM para evitar errores y mejorar la lógica del sistema.

---

## Requisitos

### 1. Prisma ENUMs

Crear:

enum MessageSender {
  USER
  CLIENT
}

enum TriggerType {
  KEYWORD
  STATUS_CHANGE
  TIME_DELAY
}

enum ActionType {
  SEND_MESSAGE
  TAG
  CHANGE_STATUS
}

---

### 2. Actualizar modelos

Message.sender → MessageSender  
Automation.triggerType → TriggerType  
Automation.actionType → ActionType  

---

### 3. Migración

- generar migración segura
- convertir datos existentes

---

### 4. Código

- actualizar servicios
- actualizar DTOs
- asegurar validación

---

## Importante

- no romper lógica actual
- mantener comportamiento actual
- solo mejorar tipado

---

## Resultado esperado

- sistema tipado
- sin strings arbitrarios
- base sólida para crecimiento