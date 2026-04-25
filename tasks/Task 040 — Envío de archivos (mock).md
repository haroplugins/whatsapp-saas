# Task 040 — Envío de archivos (mock)

## Objetivo
Permitir enviar archivos dentro del chat del inbox usando un input file, sin backend ni almacenamiento externo.

---

## Requisitos

### 1. Botón de adjuntar

En el composer del chat (donde escribes mensajes):

- añadir botón tipo 📎
- junto al input o botón enviar

---

### 2. Selección de archivo

Al hacer click:

- abrir selector de archivos del navegador
- aceptar:
  - imágenes
  - PDFs
  - cualquier archivo básico

---

### 3. Crear mensaje tipo file

Cuando el usuario selecciona archivo:

Crear mensaje con:

```ts
{
  id: string
  type: "file"
  fileName: string
  fileUrl: string (usar URL.createObjectURL)
  sender: "user"
}
4. Mostrar en el chat

Render distinto según tipo:

Imagen:
preview (miniatura)
Otros archivos:
icono + nombre
clickable
5. Persistencia

⚠️ Importante:

NO guardar fileUrl en localStorage (se rompe al recargar)
guardar solo metadata:
fileName
type

Opcional:

mostrar como “archivo enviado (no persistido)” tras reload
6. UX
mantener estilo del chat
no romper burbujas
diferenciar mensaje de texto vs archivo
Importante
no backend
no subir archivos a servidor
no Google Drive aún
no librerías nuevas
Resultado esperado

El usuario puede:

adjuntar archivo
verlo en la conversación
entender cómo funcionará en producción