# 📚 Documentación Visual - Módulo Tarjetas

Esta carpeta contiene toda la documentación visual y funcional del módulo de tarjetas, lista para compartir con usuarios.

---

## 🎯 ¿Qué hay aquí?

### 📄 Para Usuarios Finales

#### 1. **Guía Visual HTML** (⭐ RECOMENDADO)

**Archivo:** `guia-visual-tarjetas.html`

**¿Qué es?** Una guía interactiva completa en una sola página HTML con:

- Explicación paso a paso
- Diagramas de flujo visuales
- Preguntas frecuentes
- Tips y mejores prácticas
- Diseño moderno y responsive (funciona en celular)

**¿Cómo usarlo?**

```bash
# Opción 1: Doble click en el archivo
# Opción 2: Click derecho → Abrir con → Chrome/Edge/Firefox
# Opción 3: Desde terminal:
start guia-visual-tarjetas.html  # Windows
open guia-visual-tarjetas.html   # Mac
xdg-open guia-visual-tarjetas.html  # Linux
```

**✅ VENTAJAS:**

- No necesita instalación
- Funciona offline
- Se puede enviar por email
- Se puede abrir en cualquier navegador
- Tiene diagramas interactivos embebidos
- Responsive (móvil y desktop)

---

#### 2. **Cheat Sheet (Guía Rápida)**

**Archivo:** `TARJETAS-CHEAT-SHEET.md`

**¿Qué es?** Una guía de referencia rápida de 1-2 páginas con:

- Inicio rápido
- Tabla de campos obligatorios/opcionales
- Categorías disponibles
- Errores comunes y soluciones
- Tips y mejores prácticas
- Comparación antes/después

**¿Cómo usarlo?**

```bash
# Leer en GitHub (con formato bonito)
# O abrir en VS Code con preview de Markdown
# O exportar a PDF usando:
# https://www.markdowntopdf.com/
```

**✅ VENTAJAS:**

- Referencia rápida
- Fácil de imprimir
- Se puede convertir a PDF
- Formato simple y claro

---

### 🔧 Para Desarrolladores/Técnicos

#### 3. **Documentación Técnica Completa**

**Archivo:** `FINANCIAL-MODULE.md`

**Contenido:**

- Arquitectura del módulo
- Entidades y relaciones
- Flujos de trabajo técnicos
- Patrones de diseño
- Troubleshooting
- Guía de desarrollo

---

#### 4. **Diagramas Mermaid** (Fuente)

**Archivos:** `diagrams/*.mmd`

Diagramas técnicos en formato Mermaid:

- `financial-module-erd.mmd` - Diagrama entidad-relación completo
- `financial-module-flows.mmd` - Flujos operacionales
- `financial-module-architecture.mmd` - Arquitectura y patrones
- `siba-system-context.mmd` - Integración con otros módulos
- `tarjetas-user-guide.mmd` - Flujo de usuario simplificado

**¿Cómo visualizarlos?**

**Opción 1: VS Code**

1. Instalar extensión: "Markdown Preview Mermaid Support"
2. Abrir archivo .mmd
3. Ctrl+Shift+V (preview)

**Opción 2: Mermaid Live Editor** (Online)

1. Ir a https://mermaid.live
2. Copiar/pegar el contenido del archivo
3. Ver, editar y exportar a PNG/SVG

**Opción 3: Incluir en documentación Markdown**

````markdown
```mermaid
[contenido del archivo .mmd]
```
````

```

---

## 📤 Cómo Compartir

### Para Empleados (usuarios finales)

#### **Recomendación #1: Email con HTML adjunto**
```

Asunto: 📖 Nueva Guía: Cómo usar el módulo de Tarjetas en SIBA

Hola equipo,

Adjunto encontrarán una guía completa del nuevo módulo de tarjetas.

✅ Para verla: Descarguen el archivo adjunto y ábralo con cualquier navegador
(Chrome, Edge, Firefox)

La guía incluye:
• Paso a paso con capturas
• Diagramas de flujo visuales
• Preguntas frecuentes
• Tips y trucos

Cualquier duda, estamos disponibles.

Adjunto: guia-visual-tarjetas.html

````

#### **Recomendación #2: Subir a servidor interno**
```bash
# Copiar a carpeta compartida
cp guia-visual-tarjetas.html //servidor/documentacion/

# URL interna quedaría:
# http://servidor-interno/documentacion/guia-visual-tarjetas.html
````

#### **Recomendación #3: Imprimir Cheat Sheet**

1. Abrir `TARJETAS-CHEAT-SHEET.md` en VS Code
2. Ctrl+Shift+P → "Markdown PDF: Export (pdf)"
3. O usar https://www.markdowntopdf.com/
4. Imprimir y colocar en zona de trabajo

---

### Para Managers/Directores

#### **Presentación ejecutiva**

Usar el HTML como base para una presentación:

1. Abrir `guia-visual-tarjetas.html` en navegador
2. F11 (pantalla completa)
3. Scrollear mostrando cada sección
4. Enfatizar:
   - Beneficios (sección final)
   - Flujo automático (sección "Flujo Completo")
   - Ahorro de tiempo (comparación antes/después en Cheat Sheet)

---

### Para Soporte/Capacitación

#### **Sesión de entrenamiento**

1. **Preparación (5 min)**
   - Proyectar `guia-visual-tarjetas.html`
   - Tener SIBA abierto en otra ventana

2. **Demo en vivo (15 min)**
   - Mostrar acceso: Tesorería → Mis Gastos
   - Registrar un gasto de ejemplo paso a paso
   - Mostrar resultado (saldo actualizado, gasto en lista)

3. **Q&A con la guía (10 min)**
   - Usar sección de Preguntas Frecuentes
   - Referir a Cheat Sheet para dudas rápidas

4. **Material de referencia**
   - Enviar el HTML por email
   - Imprimir y distribuir Cheat Sheet

---

## 🎨 Personalización

### Modificar la guía HTML

El archivo `guia-visual-tarjetas.html` es autocontenido (CSS + Mermaid embebidos).

**Para cambiar colores:**

```css
/* Buscar en el <style> estas variables: */
primaryColor: '#f57c00',  /* Naranja principal */
secondaryColor: '#1976d2', /* Azul secundario */
```

**Para cambiar contenido:**

- Es HTML puro, editable con cualquier editor de texto
- Secciones claramente marcadas con comentarios
- Responsive por defecto

---

## 📊 Generar Imágenes PNG de Diagramas

Si quieres imágenes estáticas de los diagramas:

### Opción 1: Mermaid CLI (local)

```bash
# Instalar
npm install -g @mermaid-js/mermaid-cli

# Convertir
mmdc -i diagrams/financial-module-erd.mmd -o diagrams/financial-module-erd.png

# Batch convert all
cd diagrams
for file in *.mmd; do mmdc -i "$file" -o "${file%.mmd}.png"; done
```

### Opción 2: Mermaid Live (online)

1. Ir a https://mermaid.live
2. Pegar contenido del .mmd
3. Botón "Actions" → "PNG" o "SVG"
4. Descargar

### Opción 3: VS Code Extension

1. Instalar "Markdown Preview Enhanced"
2. Abrir .mmd file
3. Click derecho en preview → "Export" → "PNG"

---

## ✅ Checklist de Distribución

Antes de compartir con usuarios:

- [ ] Revisar que todos los links funcionen
- [ ] Verificar que los diagramas se vean correctamente
- [ ] Probar el HTML en diferentes navegadores (Chrome, Edge, Firefox)
- [ ] Probar en móvil (responsive)
- [ ] Revisar que no haya información sensible (passwords, URLs internas)
- [ ] Actualizar fecha de "última actualización"
- [ ] Validar que los ejemplos sean realistas
- [ ] Confirmar que los números de contacto/emails sean correctos

---

## 🔄 Actualizaciones

Cuando el módulo cambie:

1. **Actualizar documentación técnica:** `FINANCIAL-MODULE.md`
2. **Actualizar diagramas:** `diagrams/*.mmd` (si cambia arquitectura)
3. **Actualizar guía HTML:** `guia-visual-tarjetas.html` (pasos de usuario)
4. **Actualizar Cheat Sheet:** `TARJETAS-CHEAT-SHEET.md`
5. **Cambiar fecha** en footer de todos los documentos
6. **Re-distribuir** a usuarios

---

## 🎯 Casos de Uso

### Caso 1: Onboarding de nuevo empleado

```
1. Enviar guia-visual-tarjetas.html por email
2. Incluir en email: "Lee esta guía antes de usar tarjetas"
3. Sesión práctica de 15 min con Cheat Sheet impreso
```

### Caso 2: Consulta rápida de un usuario

```
Usuario: "¿El proveedor es obligatorio?"
Soporte: "Sí, mira la sección 'Proveedor' del Cheat Sheet"
[Compartir link directo o enviar PDF]
```

### Caso 3: Capacitación masiva

```
1. Enviar HTML 1 semana antes
2. Sesión grupal mostrando HTML proyectado
3. Demo en vivo en SIBA
4. Distribuir Cheat Sheet impreso
5. Follow-up: email con link a HTML
```

### Caso 4: Presentación a directorio

```
1. Abrir HTML en sección "Beneficios"
2. Mostrar comparación antes/después
3. Enfatizar ahorro de tiempo y control
4. Mostrar diagrama de flujo automático
```

---

## 📞 Soporte

Para preguntas sobre la documentación:

- **Técnicas:** Ver `FINANCIAL-MODULE.md`
- **Usuario final:** Ver HTML o Cheat Sheet
- **Modificaciones:** Contactar al equipo de desarrollo

---

## 📝 Licencia y Uso

Estos documentos son de uso interno de la empresa.

✅ **Permitido:**

- Compartir con empleados
- Imprimir
- Adaptar contenido para capacitaciones internas
- Traducir a otros idiomas

❌ **No permitido:**

- Compartir fuera de la organización
- Publicar en internet
- Modificar y redistribuir como propio

---

**Última actualización:** Febrero 2026
**Versión:** 1.0
**Sistema:** SIBA - Módulo Tarjetas
