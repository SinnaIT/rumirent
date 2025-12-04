"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

interface LeadDetail {
  id: string;
  clienteNombre: string;
  clienteRut: string;
  edificioNombre: string;
  codigoUnidad: string;
  totalLead: number;
  comision: number;
  estado: string;
  fechaCheckin: string | null;
}

interface BrokerData {
  brokerId: string;
  nombre: string;
  mes: string;
  reservas: number;
  checkin: number;
  montoBruto: number;
  anticipos: number;
  despAnticipo: number;
  liquido: number;
  leads: LeadDetail[];
}

interface ReportData {
  mes: number;
  anio: number;
  mesNombre: string;
  brokers: BrokerData[];
  totales: {
    reservas: number;
    checkin: number;
    montoBruto: number;
    liquido: number;
  };
}

export default function ReporteBrokersMensual() {
  const now = new Date();
  const [mes, setMes] = useState((now.getMonth() + 1).toString());
  const [anio, setAnio] = useState(now.getFullYear().toString());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Generate years array (current year and 5 years back)
  const anios = Array.from({ length: 6 }, (_, i) => {
    const year = now.getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/reportes/brokers-mensual?mes=${mes}&anio=${anio}`
      );

      if (!response.ok) {
        throw new Error("Error al cargar el reporte");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleRow = (brokerId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(brokerId)) {
      newExpandedRows.delete(brokerId);
    } else {
      newExpandedRows.add(brokerId);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reporte Mensual de Brokers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Mes</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-32">
              <label className="text-sm font-medium mb-2 block">Año</label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {anios.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <Card className="border-red-500">
          <CardContent className="py-6">
            <p className="text-red-500 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <Card>
          <CardHeader>
            <CardTitle>
              Reporte de {data.mesNombre} {data.anio}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.brokers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay datos para el período seleccionado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Reservas</TableHead>
                      <TableHead className="text-right">Checkin</TableHead>
                      <TableHead className="text-right">Monto Bruto</TableHead>
                      <TableHead className="text-right">Anticipos</TableHead>
                      <TableHead className="text-right">Desp Anticipos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.brokers.map((broker) => {
                      const isExpanded = expandedRows.has(broker.brokerId);
                      return (
                        <>
                          <TableRow key={broker.brokerId} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRow(broker.brokerId)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              {broker.nombre}
                            </TableCell>
                            <TableCell>{broker.mes}</TableCell>
                            <TableCell className="text-right">
                              {broker.reservas}
                            </TableCell>
                            <TableCell className="text-right">
                              {broker.checkin}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(broker.montoBruto)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(broker.anticipos)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(broker.despAnticipo)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(broker.liquido)}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${broker.brokerId}-details`}>
                              <TableCell colSpan={9} className="bg-muted/20 p-0">
                                <div className="p-4">
                                  <h4 className="font-semibold mb-2 text-sm">
                                    Detalle de Prospectos ({broker.leads.length})
                                  </h4>
                                  <div className="border rounded-md">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="text-xs">Cliente</TableHead>
                                          <TableHead className="text-xs">RUT</TableHead>
                                          <TableHead className="text-xs">Edificio</TableHead>
                                          <TableHead className="text-xs">Unidad</TableHead>
                                          <TableHead className="text-xs">Estado</TableHead>
                                          <TableHead className="text-xs text-right">Total</TableHead>
                                          <TableHead className="text-xs text-right">Comisión</TableHead>
                                          <TableHead className="text-xs text-center">Check-in</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {broker.leads.map((lead) => (
                                          <TableRow key={lead.id} className="text-xs">
                                            <TableCell>{lead.clienteNombre}</TableCell>
                                            <TableCell>{lead.clienteRut}</TableCell>
                                            <TableCell>{lead.edificioNombre}</TableCell>
                                            <TableCell>{lead.codigoUnidad}</TableCell>
                                            <TableCell>
                                              <span className={`px-2 py-1 rounded-full text-xs ${
                                                lead.estado === 'ENTREGADO' ? 'bg-green-100 text-green-800' :
                                                lead.estado === 'RESERVA_PAGADA' ? 'bg-blue-100 text-blue-800' :
                                                lead.estado === 'APROBADO' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                              }`}>
                                                {lead.estado}
                                              </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(lead.totalLead)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                              {formatCurrency(lead.comision)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {lead.fechaCheckin ? '✓' : '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>TOTALES</TableCell>
                      <TableCell className="text-right">
                        {data.totales.reservas}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.totales.checkin}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.totales.montoBruto)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.totales.liquido)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
