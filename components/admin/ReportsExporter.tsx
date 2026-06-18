"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface ReportsExporterProps {
  products: { id: string; title: string }[];
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function ReportsExporter({ products }: ReportsExporterProps) {
  const [month, setMonth] = useState(currentMonth());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatório mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mês de referência</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <Button asChild style={{ backgroundColor: "#0ea5e9" }}>
            <a href={`/api/reports/monthly.pdf?month=${month}`} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" /> Exportar relatório PDF
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios por produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Cadastre produtos para gerar relatórios individuais de desempenho.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/reports/product/${p.id}`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5 mr-1" /> PDF
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400">
        No dia 1 de cada mês, o relatório do mês anterior também é enviado automaticamente por email
        para os administradores da loja.{" "}
        <Link href="/configuracoes" className="underline">
          Gerenciar notificações
        </Link>
      </p>
    </div>
  );
}
