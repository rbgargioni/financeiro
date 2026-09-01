const segments = [
  "Padarias e alimentação",
  "Oficinas mecânicas",
  "Distribuidoras",
  "Prestadoras de serviço",
  "Lojas de vestuário",
  "Pequenas construtoras",
  "Salões e clínicas de estética",
  "Escritórios e consultorias",
];

export function Segments() {
  return (
    <section id="segmentos" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Feito para diversos segmentos
          </h2>
          <p className="mt-3 text-slate-600">
            O Fluxa se adapta à rotina financeira de negócios de diferentes tamanhos e setores.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {segments.map((segment) => (
            <div
              key={segment}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700"
            >
              {segment}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
