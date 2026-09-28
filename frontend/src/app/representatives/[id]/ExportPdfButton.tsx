"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

export function ExportPdfButton({ representativeId, representativeName }: { representativeId: string, representativeName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groupBy, setGroupBy] = useState("COMPOSER");
  const [sortBy, setSortBy] = useState("TITLE");

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/representatives/${representativeId}/export-pdf?groupBy=${groupBy}&sortBy=${sortBy}`);
      if (!response.ok) throw new Error("Falha ao exportar PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repertorio_${representativeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2"
      >
        <FileDown className="mr-2 h-4 w-4" />
        Exportar Repertório (PDF)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-zinc-950">Opções de Exportação PDF</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1">Agrupar por</label>
                <select 
                  value={groupBy} 
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 text-zinc-950"
                >
                  <option value="COMPOSER">Compositor</option>
                  <option value="GENRE">Gênero</option>
                  <option value="NONE">Nenhum (Lista única)</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1">Ordenar por</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 text-zinc-950"
                >
                  <option value="TITLE">Título da Música</option>
                  <option value="KEY">Tom</option>
                  <option value="DOMINIO">Nível de Domínio</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 h-9 px-4 py-2 text-zinc-950"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExport}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 h-9 px-4 py-2"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
