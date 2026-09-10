import { useEffect, useState } from "react";
import { api } from "../api";
import type { FoundReport, MatchResult, MissingReport } from "../types";

function scoreColor(score: number) {
  if (score >= 70) return "bg-green-100 text-green-700 border-green-300";
  if (score >= 50) return "bg-orange-100 text-orange-700 border-orange-300";
  return "bg-gray-100 text-gray-600 border-gray-300";
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [missing, setMissing] = useState<MissingReport[]>([]);
  const [found, setFound] = useState<FoundReport[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [m, mi, fo] = await Promise.all([api.matches(), api.listMissing(), api.listFound()]);
      setMatches(m);
      setMissing(mi);
      setFound(fo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Admin - Lost &amp; Found Matches</h2>
          <p className="text-sm text-gray-500">
            {missing.length} missing reports &middot; {found.length} found reports
          </p>
        </div>
        <button onClick={load} disabled={loading} className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg">
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      {matches.length === 0 && (
        <p className="text-sm text-gray-400 bg-white rounded-xl shadow p-4">No possible matches yet.</p>
      )}

      <div className="space-y-4">
        {matches.map((m) => (
          <div key={m.missing.id} className="bg-white rounded-xl shadow p-4">
            <p className="font-semibold text-sm text-gray-800">
              Missing: {m.missing.name} &middot; {m.missing.age}y &middot; {m.missing.gender}
            </p>
            <p className="text-xs text-gray-500">
              Last seen: {m.missing.lastSeenLocationName || "unknown"} at{" "}
              {new Date(m.missing.lastSeenTime).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mb-2">Contact: {m.missing.reporterContact}</p>
            <div className="space-y-2">
              {m.candidates.map((c) => (
                <div key={c.found.id} className={`border rounded-lg px-3 py-2 text-xs ${scoreColor(c.score)}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Match score: {c.score}%</span>
                    <span>{c.found.age}y &middot; {c.found.gender}</span>
                  </div>
                  <p>
                    Found at {c.found.foundLocationName || "unknown"},{" "}
                    {new Date(c.found.foundTime).toLocaleString()}
                  </p>
                  <p>Finder contact: {c.found.finderContact}</p>
                  {c.found.description && <p className="italic">"{c.found.description}"</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <details className="bg-white rounded-xl shadow p-4">
        <summary className="text-sm font-semibold cursor-pointer">All missing reports ({missing.length})</summary>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {missing.map((m) => (
            <li key={m.id}>
              {m.name} &middot; {m.age}y &middot; {m.gender} &middot; {m.lastSeenLocationName || "?"}
            </li>
          ))}
        </ul>
      </details>

      <details className="bg-white rounded-xl shadow p-4">
        <summary className="text-sm font-semibold cursor-pointer">All found reports ({found.length})</summary>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {found.map((f) => (
            <li key={f.id}>
              {f.age}y &middot; {f.gender} &middot; {f.foundLocationName || "?"}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
