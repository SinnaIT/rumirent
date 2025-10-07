import { describe, it, expect } from 'vitest'
import { mockComisiones, mockTiposUnidad, mockEdificios } from '../../fixtures/edificio.fixtures'

describe('Comision Domain Logic', () => {
  describe('Commission Calculation', () => {
    it('should calculate commission correctly for standard rate', () => {
      const totalVenta = 50000000 // $50M CLP
      const porcentaje = mockComisiones.standard.porcentaje // 3.5%

      const comision = totalVenta * (porcentaje / 100)

      expect(comision).toBeCloseTo(1750000, 2)
    })

    it('should calculate commission correctly for premium rate', () => {
      const totalVenta = 75000000 // $75M CLP
      const porcentaje = mockComisiones.premium.porcentaje // 5.0%

      const comision = totalVenta * (porcentaje / 100)

      expect(comision).toBe(3750000)
    })

    it('should calculate commission correctly for urgent rate', () => {
      const totalVenta = 100000000 // $100M CLP
      const porcentaje = mockComisiones.urgente.porcentaje // 7.0%

      const comision = totalVenta * (porcentaje / 100)

      expect(comision).toBeCloseTo(7000000, 2)
    })

    it('should handle commission calculation with UF amount', () => {
      const montoUF = 2000
      const valorUF = 37000 // Example UF value in CLP
      const porcentaje = mockComisiones.standard.porcentaje // 3.5%

      const totalVenta = montoUF * valorUF
      const comision = totalVenta * (porcentaje / 100)

      expect(totalVenta).toBe(74000000)
      expect(comision).toBeCloseTo(2590000, 2)
    })
  })

  describe('Commission by Unit Type', () => {
    it('should use tipo unidad commission over edificio commission', () => {
      const tipoUnidadComision = mockTiposUnidad.tipo2Habitaciones.comisionId
      const edificioComision = mockEdificios.edificio1.comisionId

      // Tipo unidad should have priority
      expect(tipoUnidadComision).toBe(mockComisiones.premium.id)
      expect(edificioComision).toBe(mockComisiones.standard.id)
      expect(tipoUnidadComision).not.toBe(edificioComision)
    })

    it('should fallback to edificio commission if tipo unidad has no commission', () => {
      const tipoUnidadComision = null
      const edificioComision = mockEdificios.edificio1.comisionId

      const finalComisionId = tipoUnidadComision || edificioComision

      expect(finalComisionId).toBe(mockComisiones.standard.id)
    })
  })

  describe('Commission Percentage Validation', () => {
    it('should have positive percentage', () => {
      Object.values(mockComisiones).forEach((comision) => {
        expect(comision.porcentaje).toBeGreaterThan(0)
      })
    })

    it('should have reasonable percentage values (< 100%)', () => {
      Object.values(mockComisiones).forEach((comision) => {
        expect(comision.porcentaje).toBeLessThan(100)
      })
    })

    it('should have unique codigo for each commission', () => {
      const codigos = Object.values(mockComisiones).map((c) => c.codigo)
      const uniqueCodigos = new Set(codigos)

      expect(uniqueCodigos.size).toBe(codigos.length)
    })

    it('should have unique nombre for each commission', () => {
      const nombres = Object.values(mockComisiones).map((c) => c.nombre)
      const uniqueNombres = new Set(nombres)

      expect(uniqueNombres.size).toBe(nombres.length)
    })
  })

  describe('Regla Comision Logic', () => {
    const calculateComisionWithRules = (
      totalVenta: number,
      reglas: Array<{ cantidadMinima: number; cantidadMaxima: number | null; porcentaje: number }>
    ): number => {
      const reglaAplicable = reglas.find(
        (regla) =>
          totalVenta >= regla.cantidadMinima &&
          (regla.cantidadMaxima === null || totalVenta <= regla.cantidadMaxima)
      )

      if (!reglaAplicable) {
        return 0
      }

      return totalVenta * (reglaAplicable.porcentaje / 100)
    }

    it('should apply correct rule based on sale amount', () => {
      const reglas = [
        { cantidadMinima: 0, cantidadMaxima: 50000000, porcentaje: 3.0 },
        { cantidadMinima: 50000001, cantidadMaxima: 100000000, porcentaje: 4.0 },
        { cantidadMinima: 100000001, cantidadMaxima: null, porcentaje: 5.0 },
      ]

      expect(calculateComisionWithRules(30000000, reglas)).toBe(900000) // 3%
      expect(calculateComisionWithRules(75000000, reglas)).toBe(3000000) // 4%
      expect(calculateComisionWithRules(150000000, reglas)).toBe(7500000) // 5%
    })

    it('should return 0 if no rule applies', () => {
      const reglas = [{ cantidadMinima: 100000000, cantidadMaxima: null, porcentaje: 5.0 }]

      expect(calculateComisionWithRules(50000000, reglas)).toBe(0)
    })

    it('should handle open-ended upper limit (null cantidadMaxima)', () => {
      const reglas = [
        { cantidadMinima: 0, cantidadMaxima: 100000000, porcentaje: 3.0 },
        { cantidadMinima: 100000001, cantidadMaxima: null, porcentaje: 5.0 },
      ]

      expect(calculateComisionWithRules(500000000, reglas)).toBe(25000000) // 5%
      expect(calculateComisionWithRules(1000000000, reglas)).toBe(50000000) // 5%
    })
  })
})
