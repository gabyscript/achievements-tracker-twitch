import { useEffect, useMemo, useState } from "react";
import {
  Combobox, ComboboxInput, ComboboxOptions, ComboboxOption,
} from "@headlessui/react";
import type { GameSummary } from "../../shared/types";

export default function Home() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GameSummary | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return (await res.json()) as GameSummary[];
      })
      .then(setGames)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Falló la carga"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => games.filter((g) => g.name.toLowerCase().includes(query.toLowerCase())),
    [games, query]
  );

  const overlayUrl = selected
    ? `${window.location.origin}/overlay?appid=${selected.appid}`
    : "";
  const demoUrl = overlayUrl && `${overlayUrl}&demo=1&interval=5&demoStep=25`;

  const copy = async (url: string, tag: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(tag);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <p className="min-h-screen bg-zinc-950 p-8 text-zinc-400">Cargando biblioteca…</p>;
  if (error) return <p className="min-h-screen bg-zinc-950 p-8 text-red-400">{error}</p>;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-semibold">Overlay de logros</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Elige un juego y pega la URL como Browser Source en OBS.
        </p>

        <Combobox value={selected} onChange={setSelected} immediate>
          <div className="relative mt-6">
            <ComboboxInput
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5
                         focus:border-zinc-500 focus:outline-none"
              placeholder="Buscar juego…"
              displayValue={(g: GameSummary | null) => g?.name ?? ""}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ComboboxOptions
              className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg
                         border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
            >
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-zinc-500">Sin resultados</div>
              )}
              {filtered.map((game) => (
                <ComboboxOption
                  key={game.appid}
                  value={game}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2
                             data-focus:bg-zinc-800"
                >
                  <img src={game.coverUrl} alt="" className="h-8 w-[70px] rounded object-cover" />
                  <span className="truncate text-sm">{game.name}</span>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </div>
        </Combobox>

        {selected && (
          <section className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <code className="block truncate text-xs text-zinc-400">{overlayUrl}</code>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => copy(overlayUrl, "real")}
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium
                           text-zinc-900 hover:bg-white"
              >
                {copied === "real" ? "Copiado" : "Copiar URL"}
              </button>
              <button
                onClick={() => copy(demoUrl, "demo")}
                title={demoUrl}
                className="rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-2
                           text-sm font-medium text-amber-300 hover:bg-amber-400/20"
              >
                {copied === "demo" ? "Copiado" : "Copiar URL de prueba (demo)"}
              </button>
            </div>

            <dl className="mt-4 space-y-1 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-mono text-zinc-400">&amp;interval=30</dt>
                <dd>segundos entre refrescos: 30–300, por defecto 120 (en demo, desde 5)</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-mono text-zinc-400">&amp;debug=1</dt>
                <dd>muestra los errores y la hora del último refresco en pantalla</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-mono text-zinc-400">&amp;demo=1</dt>
                <dd>
                  hace subir el contador solo, para comprobar que el overlay refresca
                  sin esperar a desbloquear un logro real
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-mono text-zinc-400">&amp;demoStep=25</dt>
                <dd>logros que suma el demo en cada refresco (por defecto 1)</dd>
              </div>
            </dl>

            <details className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
              <summary className="cursor-pointer text-zinc-300 hover:text-white">
                Cómo usarlo en OBS
              </summary>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-zinc-500">
                <li>Fuentes → <strong className="text-zinc-300">+</strong> → Navegador.</li>
                <li>Pega la URL de arriba y pon el tamaño en <code>460 × 110</code>.</li>
                <li>
                  <strong className="text-amber-300">Desmarca</strong> “Apagar la fuente cuando
                  no esté visible” y “Actualizar el navegador cuando la escena se active”.
                  Si los dejas activados, la página se recarga en cada cambio de escena,
                  pierde el conteo anterior y el destello dorado de logro nuevo nunca aparece.
                </li>
                <li>
                  ¿No estás seguro de que refresque? Usa el botón de demo: el contador
                  sube solo cada 5 segundos y verás crecer la barra.
                </li>
              </ol>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}
