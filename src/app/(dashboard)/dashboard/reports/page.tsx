"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, AlertTriangle, Loader2, FileSpreadsheet } from "lucide-react";
import { getStagnantInventoryReportAction } from "@/app/actions/report.actions";
import { Piece, Category, Brand, Lot } from "@prisma/client";

type StagnantPiece = Piece & {
  category: Category;
  brand: Brand;
  lot: Lot;
};

export default function ReportsPage() {
  const mockCompanyId = "company-placeholder-id";

  const [pieces, setPieces] = useState<StagnantPiece[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const data = await getStagnantInventoryReportAction(mockCompanyId);
    setPieces(data as StagnantPiece[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      await loadReport();
    };
    fetchInitialData();
  }, [loadReport]);

  // Função nativa para gerar e baixar um arquivo CSV
  const handleExportCSV = () => {
    if (pieces.length === 0) return;

    // Cabeçalhos do CSV
    const headers = ["SKU", "Nome da Peca", "Categoria", "Marca", "Lote Origem", "Data Cadastro", "Custo Estimado (R$)", "Preco Venda (R$)"];
    
    // Mapeamento das linhas
    const rows = pieces.map(piece => [
      piece.code,
      `"${piece.name}"`, // Aspas para evitar quebra de coluna se houver vírgulas no nome
      piece.category.name,
      piece.brand.name,
      piece.lot.code,
      new Date(piece.createdAt).toLocaleDateString("pt-BR"),
      piece.purchasePrice.toString(),
      piece.estimatedSalePrice.toString()
    ]);

    // Unir tudo numa string formatada
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Criar o arquivo e forçar o download no navegador
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_estagnado_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-sm font-medium">A compilar relatório de estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Relatórios Gerenciais</h1>
          <p className="text-zinc-500">Extraia insights e dados consolidados da sua operação.</p>
        </div>
      </div>

      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50 rounded-t-xl border-b border-amber-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Estoque Estagnado (+90 dias)
            </CardTitle>
            <CardDescription className="text-amber-700/70 mt-1">
              Peças que estão no estoque físico há mais de 3 meses sem movimentação.
            </CardDescription>
          </div>
          <Button 
            onClick={handleExportCSV} 
            disabled={pieces.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {pieces.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-b-xl">
              <FileSpreadsheet className="w-12 h-12 text-zinc-300 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">Estoque Saudável!</h3>
              <p className="text-sm text-zinc-500 max-w-sm mt-1">
                Neste momento, você não possui nenhuma peça parada há mais de 90 dias no seu inventário.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Tempo Parado</TableHead>
                  <TableHead className="text-right">Potencial Retido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pieces.map((piece) => {
                  const daysInStock = Math.floor((new Date().getTime() - new Date(piece.createdAt).getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <TableRow key={piece.id}>
                      <TableCell className="font-medium text-zinc-600">{piece.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900">{piece.name}</span>
                          <span className="text-xs text-zinc-500">{piece.brand.name} • {piece.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-zinc-600">{piece.lot.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                          {daysInStock} dias
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-zinc-900">
                        {formatCurrency(piece.estimatedSalePrice)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}   