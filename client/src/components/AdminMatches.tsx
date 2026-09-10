import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  RefreshCw,
  Sparkles,
  UserX,
  CheckCircle2,
  Phone,
  Search,
  FileCheck,
} from "lucide-react";
import { api } from "../api";
import type { FoundReport, MatchResult, MissingReport } from "../types";
import { formatTimeAgo } from "../utils";

function scoreBadgeMeta(score: number) {
  if (score >= 70) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-300",
      barBg: "bg-emerald-500",
      label: "HIGH CONFIDENCE MATCH",
    };
  }
  if (score >= 50) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-300",
      barBg: "bg-amber-500",
      label: "MODERATE PROBABILITY",
    };
  }
  return {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    barBg: "bg-slate-400",
    label: "LOW PROBABILITY",
  };
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [missing, setMissing] = useState<MissingReport[]>([]);
  const [found, setFound] = useState<FoundReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"matches" | "missing" | "found">("matches");
  const [search, setSearch] = useState("");
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);

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

  const handleVerify = (missingId: string, foundId: string) => {
    const key = `${missingId}-${foundId}`;
    setVerifiedIds((prev) => [...prev, key]);
  };

  // KPI Calculations
  const highConfidenceCount = matches.filter((m) =>
    m.candidates.some((c) => c.score >= 70)
  ).length;

  const filteredMatches = matches.filter((m) => {
    return (
      m.missing.name.toLowerCase().includes(search.toLowerCase()) ||
      m.missing.lastSeenLocationName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredMissing = missing.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.lastSeenLocationName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFound = found.filter((f) =>
    f.foundLocationName.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6"
    >
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200/90">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Simhasth 2028 Security &amp; Safety Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            AI Match &amp; Case Verification Center
          </h2>
          <p className="text-xs text-slate-500">
            Real-time biometric &amp; semantic similarity correlation for lost pilgrims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Scanning Database..." : "Sync Live Feed"}</span>
          </motion.button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-1"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Missing Cases
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{missing.length}</span>
            <span className="text-xs text-slate-500">active</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-1"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Found Persons
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{found.length}</span>
            <span className="text-xs text-slate-500">safe at booths</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-1"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            AI High Matches
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{highConfidenceCount}</span>
            <span className="text-xs text-amber-600 font-bold">&ge;70% Score</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-1"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Verified Matches
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{verifiedIds.length}</span>
            <span className="text-xs text-blue-600 font-semibold">reunited</span>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation with Framer Motion Sliding Pill */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl border border-slate-300/60 relative">
          <button
            onClick={() => setTab("matches")}
            className={`relative text-xs font-bold px-3.5 py-2 rounded-xl transition-colors z-10 ${
              tab === "matches" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "matches" && (
              <motion.div
                layoutId="adminTab"
                className="absolute inset-0 bg-amber-600 rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">AI Matches ({matches.length})</span>
          </button>

          <button
            onClick={() => setTab("missing")}
            className={`relative text-xs font-bold px-3.5 py-2 rounded-xl transition-colors z-10 ${
              tab === "missing" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "missing" && (
              <motion.div
                layoutId="adminTab"
                className="absolute inset-0 bg-rose-600 rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">All Missing ({missing.length})</span>
          </button>

          <button
            onClick={() => setTab("found")}
            className={`relative text-xs font-bold px-3.5 py-2 rounded-xl transition-colors z-10 ${
              tab === "found" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "found" && (
              <motion.div
                layoutId="adminTab"
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">All Found ({found.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* TAB 1: AI MATCH QUEUE */}
      {tab === "matches" && (
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">No active AI matches found yet</h3>
              <p className="text-xs text-slate-500">
                When new missing or found reports are submitted, our similarity engine will rank and present candidates here.
              </p>
            </div>
          ) : (
            filteredMatches.map((m) => (
              <motion.div
                key={m.missing.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200 space-y-4 transition-all"
              >
                {/* Missing Person Profile Header */}
                <div className="bg-rose-50/70 border border-rose-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full">
                          MISSING CASE
                        </span>
                        <span className="text-xs text-slate-500">{formatTimeAgo(m.missing.createdAt)}</span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 mt-0.5">{m.missing.name}</h4>
                      <p className="text-xs text-slate-600">
                        {m.missing.age} Yrs &bull; {m.missing.gender.toUpperCase()} &bull; Last seen: <strong>{m.missing.lastSeenLocationName || "Unknown"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 sm:text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Reporter Contact</span>
                    <a
                      href={`tel:${m.missing.reporterContact}`}
                      className="font-bold text-rose-700 hover:underline flex sm:justify-end items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> {m.missing.reporterContact}
                    </a>
                  </div>
                </div>

                {/* Candidate Matches */}
                <div className="space-y-3 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-amber-300">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>AI Predicted Found Candidates ({m.candidates.length})</span>
                  </div>

                  {m.candidates.map((c) => {
                    const badge = scoreBadgeMeta(c.score);
                    const isVerified = verifiedIds.includes(`${m.missing.id}-${c.found.id}`);

                    return (
                      <div
                        key={c.found.id}
                        className={`rounded-2xl p-4 border transition-all ${badge.bg} ${badge.border} space-y-3`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white font-extrabold text-xs shadow-xs border border-slate-200">
                              <span className={`w-2 h-2 rounded-full ${badge.barBg}`} />
                              <span>{c.score}% Match Confidence</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {badge.label}
                            </span>
                          </div>

                          <AnimatePresence mode="wait">
                            {isVerified ? (
                              <motion.span
                                key="verified"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Reunited &amp; Verified
                              </motion.span>
                            ) : (
                              <motion.button
                                key="mark"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => handleVerify(m.missing.id, c.found.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Mark Verified</span>
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Match Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-xl border border-slate-200/80">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Found Person Details
                            </span>
                            <p className="font-semibold text-slate-900 mt-0.5">
                              Approx. {c.found.age} Yrs &bull; {c.found.gender.toUpperCase()}
                            </p>
                            <p className="text-slate-600 mt-0.5">
                              Found at: <strong>{c.found.foundLocationName}</strong>
                            </p>
                            {c.found.description && (
                              <p className="text-slate-500 italic mt-1 text-[11px]">
                                "{c.found.description}"
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Finder Contact &amp; Actions
                            </span>
                            <p className="text-slate-700">
                              Contact: <strong>{c.found.finderContact}</strong>
                            </p>
                            <div className="pt-1 flex gap-2">
                              <a
                                href={`tel:${c.found.finderContact}`}
                                className="inline-flex items-center gap-1 bg-slate-900 text-white font-semibold text-[11px] px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                              >
                                <Phone className="w-3 h-3" /> Call Finder
                              </a>
                              <a
                                href={`tel:${m.missing.reporterContact}`}
                                className="inline-flex items-center gap-1 bg-rose-600 text-white font-semibold text-[11px] px-3 py-1 rounded-lg hover:bg-rose-700 transition-colors"
                              >
                                <Phone className="w-3 h-3" /> Call Family
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ALL MISSING REPORTS TABLE */}
      {tab === "missing" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">All Missing Person Filings</h3>
            <span className="text-xs text-slate-400 font-semibold">{filteredMissing.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Age / Gender</th>
                  <th className="p-3">Last Seen Location</th>
                  <th className="p-3">Reported Time</th>
                  <th className="p-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMissing.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{m.name}</td>
                    <td className="p-3">{m.age}y / {m.gender}</td>
                    <td className="p-3">{m.lastSeenLocationName || "—"}</td>
                    <td className="p-3 text-slate-500">{new Date(m.lastSeenTime).toLocaleDateString()}</td>
                    <td className="p-3 font-mono font-semibold text-rose-600">{m.reporterContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB 3: ALL FOUND REPORTS TABLE */}
      {tab === "found" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">All Registered Found Persons</h3>
            <span className="text-xs text-slate-400 font-semibold">{filteredFound.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-3">Found Location</th>
                  <th className="p-3">Approx Age / Gender</th>
                  <th className="p-3">Found Time</th>
                  <th className="p-3">Finder Contact</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFound.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{f.foundLocationName}</td>
                    <td className="p-3">~{f.age}y / {f.gender}</td>
                    <td className="p-3 text-slate-500">{new Date(f.foundTime).toLocaleDateString()}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-600">{f.finderContact}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{f.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
