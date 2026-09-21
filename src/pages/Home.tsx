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
  const [copied, setCopied] = useState(false);

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

  const copy = async () => {
    await navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <p className="p-8 text-zinc-400">Cargando biblioteca…</p>;
  if (error) return <p className="p-8 text-red-400">{error}</p>;

  return (
    <main className="mx-auto max-w-xl p-8 text-zinc-100">
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
          <button
            onClick={copy}
            className="mt-3 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium
                       text-zinc-900 hover:bg-white"
          >
            {copied ? "Copiado" : "Copiar URL"}
          </button>
        </section>
      )}
    </main>
  );
}