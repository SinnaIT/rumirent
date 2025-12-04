#!/usr/bin/env python3
import re

# Leer el archivo
with open('src/app/broker/generar-lead/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Cambio 1: Agregar validación después de la validación de edificioId
validation_to_add = '''
    // Validación: si se ingresa código manual, el tipo de unidad es obligatorio
    if (formData.codigoUnidad && !formData.unidadId && !formData.tipoUnidadEdificioId) {
      toast.error('Debe seleccionar una tipología cuando ingresa un código de unidad manual')
      return
    }
'''

# Buscar el punto de inserción (después de la validación de edificioId)
pattern1 = r"(    if \(!formData\.edificioId\) \{\s+toast\.error\('Debe seleccionar un edificio'\)\s+return\s+\})"
content = re.sub(pattern1, r"\1" + validation_to_add, content)

# Cambio 2: Eliminar el bloque de creación de unidad manual (líneas 510-542)
# Buscar y reemplazar todo el bloque de creación de unidad
pattern2 = r"      // Task 12\.2: Auto-crear unidad si se ingresó código manual\s+let unidadIdToUse = formData\.unidadId\s+if \(!unidadIdToUse && formData\.codigoUnidad && formData\.tipoUnidadEdificioId\) \{[\s\S]*?\}[\s\S]*?\}"

replacement2 = '''      // La creación automática de unidad se maneja en el backend (API)
      const unidadIdToUse = formData.unidadId'''

content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE)

# Cambio 3: Actualizar el label de tipología para hacerlo dinámicamente obligatorio
pattern3 = r'<Label htmlFor="tipologia">Tipología \(Opcional\)</Label>'
replacement3 = '<Label htmlFor="tipologia">Tipología {formData.codigoUnidad && !formData.unidadId ? \'*\' : \'(Opcional)\'}</Label>'
content = re.sub(pattern3, replacement3, content)

# Cambio 4: Actualizar el mensaje de ayuda del código manual
pattern4 = r'(<p className="text-xs text-muted-foreground">\s+Use este campo si la unidad no está registrada en el sistema\s+</p>)'
replacement4 = '''<p className="text-xs text-muted-foreground">
                  Use este campo si la unidad no está registrada en el sistema.
                  {formData.codigoUnidad && !formData.unidadId && (
                    <span className="text-orange-600 font-medium"> Debe seleccionar una tipología para continuar.</span>
                  )}
                </p>'''
content = re.sub(pattern4, replacement4, content)

# Escribir el archivo modificado
with open('src/app/broker/generar-lead/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Archivo modificado exitosamente")
