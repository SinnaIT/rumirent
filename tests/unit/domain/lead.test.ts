import { describe, it, expect } from 'vitest'
import { EstadoLead } from '@prisma/client'
import { mockLeads } from '../../fixtures/lead.fixtures'

describe('Lead Domain Logic', () => {
  describe('Lead State Transitions', () => {
    const validTransitions: Record<EstadoLead, EstadoLead[]> = {
      [EstadoLead.ENTREGADO]: [EstadoLead.RESERVA_PAGADA, EstadoLead.RECHAZADO],
      [EstadoLead.RESERVA_PAGADA]: [EstadoLead.APROBADO, EstadoLead.RECHAZADO],
      [EstadoLead.APROBADO]: [],
      [EstadoLead.RECHAZADO]: [],
    }

    const canTransition = (from: EstadoLead, to: EstadoLead): boolean => {
      return validTransitions[from].includes(to)
    }

    it('should allow transition from ENTREGADO to RESERVA_PAGADA', () => {
      expect(canTransition(EstadoLead.ENTREGADO, EstadoLead.RESERVA_PAGADA)).toBe(true)
    })

    it('should allow transition from ENTREGADO to RECHAZADO', () => {
      expect(canTransition(EstadoLead.ENTREGADO, EstadoLead.RECHAZADO)).toBe(true)
    })

    it('should allow transition from RESERVA_PAGADA to APROBADO', () => {
      expect(canTransition(EstadoLead.RESERVA_PAGADA, EstadoLead.APROBADO)).toBe(true)
    })

    it('should allow transition from RESERVA_PAGADA to RECHAZADO', () => {
      expect(canTransition(EstadoLead.RESERVA_PAGADA, EstadoLead.RECHAZADO)).toBe(true)
    })

    it('should not allow transition from ENTREGADO to APROBADO', () => {
      expect(canTransition(EstadoLead.ENTREGADO, EstadoLead.APROBADO)).toBe(false)
    })

    it('should not allow any transitions from APROBADO', () => {
      expect(canTransition(EstadoLead.APROBADO, EstadoLead.ENTREGADO)).toBe(false)
      expect(canTransition(EstadoLead.APROBADO, EstadoLead.RESERVA_PAGADA)).toBe(false)
      expect(canTransition(EstadoLead.APROBADO, EstadoLead.RECHAZADO)).toBe(false)
    })

    it('should not allow any transitions from RECHAZADO', () => {
      expect(canTransition(EstadoLead.RECHAZADO, EstadoLead.ENTREGADO)).toBe(false)
      expect(canTransition(EstadoLead.RECHAZADO, EstadoLead.RESERVA_PAGADA)).toBe(false)
      expect(canTransition(EstadoLead.RECHAZADO, EstadoLead.APROBADO)).toBe(false)
    })
  })

  describe('Lead Date Validation', () => {
    it('should have fechaPagoReserva for RESERVA_PAGADA state', () => {
      const lead = mockLeads.leadReservaPagada

      expect(lead.estado).toBe(EstadoLead.RESERVA_PAGADA)
      expect(lead.fechaPagoReserva).not.toBeNull()
    })

    it('should have fechaPagoLead for APROBADO state', () => {
      const lead = mockLeads.leadAprobado

      expect(lead.estado).toBe(EstadoLead.APROBADO)
      expect(lead.fechaPagoLead).not.toBeNull()
    })

    it('should have logical date progression', () => {
      const lead = mockLeads.leadAprobado

      if (lead.fechaPagoReserva && lead.fechaPagoLead && lead.fechaCheckin) {
        expect(lead.fechaPagoReserva.getTime()).toBeLessThan(lead.fechaPagoLead.getTime())
        expect(lead.fechaPagoLead.getTime()).toBeLessThan(lead.fechaCheckin.getTime())
      }
    })

    it('should not have fechaPagoReserva for ENTREGADO state', () => {
      const lead = mockLeads.leadEntregado

      expect(lead.estado).toBe(EstadoLead.ENTREGADO)
      expect(lead.fechaPagoReserva).toBeNull()
    })
  })

  describe('Lead Commission Validation', () => {
    it('should have positive commission for approved leads', () => {
      const lead = mockLeads.leadAprobado

      expect(lead.estado).toBe(EstadoLead.APROBADO)
      expect(lead.comision).toBeGreaterThan(0)
    })

    it('should have zero commission for rejected leads', () => {
      const lead = mockLeads.leadRechazado

      expect(lead.estado).toBe(EstadoLead.RECHAZADO)
      expect(lead.comision).toBe(0)
    })

    it('should calculate commission correctly based on total', () => {
      const lead = mockLeads.leadAprobado
      const expectedComision = lead.totalLead * 0.07 // 7% commission

      expect(lead.comision).toBeCloseTo(expectedComision, 2)
    })
  })

  describe('Lead Conciliation Logic', () => {
    it('should be conciliado only when APROBADO', () => {
      const leadAprobado = mockLeads.leadAprobado
      const leadEntregado = mockLeads.leadEntregado

      expect(leadAprobado.estado).toBe(EstadoLead.APROBADO)
      expect(leadAprobado.conciliado).toBe(true)

      expect(leadEntregado.estado).toBe(EstadoLead.ENTREGADO)
      expect(leadEntregado.conciliado).toBe(false)
    })

    it('should have fechaConciliacion when conciliado', () => {
      const lead = mockLeads.leadAprobado

      expect(lead.conciliado).toBe(true)
      expect(lead.fechaConciliacion).not.toBeNull()
    })

    it('should not have fechaConciliacion when not conciliado', () => {
      const lead = mockLeads.leadEntregado

      expect(lead.conciliado).toBe(false)
      expect(lead.fechaConciliacion).toBeNull()
    })
  })

  describe('Lead Unit Assignment', () => {
    it('should have unidadId OR codigoUnidad for non-rejected leads', () => {
      Object.values(mockLeads).forEach((lead) => {
        if (lead.estado !== EstadoLead.RECHAZADO) {
          const hasUnidadId = lead.unidadId !== null
          const hasCodigoUnidad = lead.codigoUnidad !== null

          expect(hasUnidadId || hasCodigoUnidad).toBe(true)
        }
      })
    })

    it('should allow flexible unit reference', () => {
      const leadConUnidad = mockLeads.leadEntregado
      const leadSinUnidad = mockLeads.leadRechazado

      expect(leadConUnidad.unidadId).not.toBeNull()
      expect(leadConUnidad.codigoUnidad).not.toBeNull()

      expect(leadSinUnidad.unidadId).toBeNull()
      expect(leadSinUnidad.codigoUnidad).toBeNull()
    })
  })

  describe('Lead Amount Validation', () => {
    it('should have positive totalLead', () => {
      Object.values(mockLeads).forEach((lead) => {
        expect(lead.totalLead).toBeGreaterThan(0)
      })
    })

    it('should have positive montoUf', () => {
      Object.values(mockLeads).forEach((lead) => {
        expect(lead.montoUf).toBeGreaterThan(0)
      })
    })

    it('should have consistent totalLead and montoUf relationship', () => {
      const valorUFPromedio = 37000 // Approximate UF value

      Object.values(mockLeads).forEach((lead) => {
        const calculatedTotal = lead.montoUf * valorUFPromedio
        const difference = Math.abs(lead.totalLead - calculatedTotal)
        const percentDifference = (difference / lead.totalLead) * 100

        // Allow 50% variance due to UF fluctuations and fixture data
        expect(percentDifference).toBeLessThan(50)
      })
    })
  })
})
