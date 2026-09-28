import { ExportPdfButton } from "./ExportPdfButton";

async function getRepresentative(id: string) {
  // Try to fetch from backend if running, otherwise provide mock for UI display
  try {
    const res = await fetch(`http://localhost:8080/api/representatives`, { cache: 'no-store' });
    if (res.ok) {
      const all = await res.json();
      const rep = all.find((r: any) => r.id === id);
      if (rep) return rep;
    }
  } catch (e) {
    console.warn("Backend unavailable, using fallback data");
  }

  // Fallback to avoid error 500 when testing without DB connection or invalid ID
  return { id, name: "Representante Desconhecido", type: "SINGER", contactInfo: "", active: true };
}

export default async function RepresentativePage({ params }: { params: { id: string } }) {
  // In Next.js 15, params is usually available synchronously or awaited. Let's await it to be safe.
  const resolvedParams = await params;
  const representative = await getRepresentative(resolvedParams.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">{representative.name}</h2>
          <p className="text-zinc-500 mt-1">Detalhes e Repertório do Representante</p>
        </div>
        <ExportPdfButton representativeId={representative.id} representativeName={representative.name} />
      </div>

      <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-zinc-400 bg-white">
        <p>A listagem completa de músicas deste representante será implementada em breve.</p>
        <p className="mt-2 text-sm text-zinc-500">Utilize o botão acima para testar a exportação de PDF.</p>
      </div>
    </div>
  );
}
