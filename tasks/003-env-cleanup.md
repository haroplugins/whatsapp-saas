# Task 003 — Environment Cleanup for API/Prisma

## Objetivo
Corregir la gestión de variables de entorno para que el monorepo use una estrategia limpia y centralizada.

---

## Problema a corregir
Actualmente existen archivos `.env` dentro de `apps/api`, pero quiero que la fuente principal de configuración sea el archivo `.env` en la raíz del proyecto.

---

## Requisitos

1. Hacer que `apps/api` lea `DATABASE_URL` desde el `.env` raíz del monorepo.
2. Ajustar NestJS y Prisma para que funcionen correctamente con esa estrategia.
3. Evitar duplicidad operativa de `.env` dentro de `apps/api`.
4. Si `apps/api/.env.example` aporta valor documental, puede mantenerse solo como referencia, pero no como fuente principal de ejecución.
5. Confirmar que:
   - prisma validate funciona
   - prisma generate funciona
   - apps/api build funciona

---

## Importante

- No tocar web ni app
- No implementar auth todavía
- No cambiar el esquema de datos
- No crear tablas nuevas
- No añadir lógica de negocio

---

## Resultado esperado

Quiero un setup claro donde:
- el `.env` raíz sea la fuente principal
- `apps/api` funcione correctamente
- Prisma siga operativo
- la estructura quede más limpia y coherente para el futuro