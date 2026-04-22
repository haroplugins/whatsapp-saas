# Task 001 — Base Project Setup

## Objetivo
Crear la base del monorepo con las apps necesarias.

---

## Requisitos

Crear estructura:

- apps/web (Next.js)
- apps/app (Next.js)
- apps/api (NestJS)

---

## Detalles

### Web y App
- Next.js (App Router)
- TypeScript
- ESLint + Prettier

### API
- NestJS
- TypeScript

---

## Monorepo

Configurar:
- package.json raíz
- workspaces (npm o pnpm)
- scripts globales

---

## Scripts root

- dev:web
- dev:app
- dev:api
- dev (todos en paralelo)

---

## Resultado esperado

Proyecto arranca en local:

- web → localhost:3000
- app → localhost:3001
- api → localhost:3002

---

## Importante

- no añadir lógica aún
- solo estructura base
- todo tipado