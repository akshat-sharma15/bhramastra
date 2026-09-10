import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  UserX,
  UserCheck,
  MapPin,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Search,
  Navigation,
  Sparkles,
} from "lucide-react";
import { api } from "../api";
import type { MissingReport, FoundReport } from "../types";
import { formatTimeAgo } from "../utils";

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

type Tab = "missing" | "found" | "browse";

export default function LostFound({ userLocation }: Props) {
  const [tab, setTab] = useState<Tab>("missing");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submittedType, setSubmittedType] = useState<"missing" | "found" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(true);

  // Browse state
  const [allMissing, setAllMissing] = useState<MissingReport[]>([]);
  const [allFound, setAllFound] = useState<FoundReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  const [missingForm, setMissingForm] = useState({
    name: "",
    age: "",
    gender: "female",
    lastSeenLocationName: "",
    lastSeenTime: "",
    description: "",
    reporterContact: "",
  });

  const [foundForm, setFoundForm] = useState({
    age: "",
    gender: "female",
    foundLocationName: "",
    foundTime: "",
    description: "",
    finderContact: "",
  });

  const loadFeed = async () => {
    try {
      const [m, f] = await Promise.all([api.listMissing(), api.listFound()]);
      setAllMissing(m);
      setAllFound(f);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleUseGpsForLocation = (isMissing: boolean) => {
    if (!userLocation) {
      setError("GPS location is not active. Please allow browser location access.");
      return;
    }
    const locationString = `GPS Point (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}) - Near Simhasth Sector`;
    if (isMissing) {
      setMissingForm((prev) => ({ ...prev, lastSeenLocationName: locationString }));
    } else {
      setFoundForm((prev) => ({ ...prev, foundLocationName: locationString }));
    }
  };

  const submitMissing = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.reportMissing({
        ...missingForm,
        age: Number(missingForm.age),
        lastSeenTime: missingForm.lastSeenTime || new Date().toISOString(),
        lat: useLocation && userLocation ? userLocation.lat : null,
        lng: useLocation && userLocation ? userLocation.lng : null,
      });
      setSubmittedId(result.id);
      setSubmittedType("missing");
      setMissingForm({
        name: "",
        age: "",
        gender: "female",
        lastSeenLocationName: "",
        lastSeenTime: "",
        description: "",
        reporterContact: "",
      });
      loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit missing report. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const submitFound = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.reportFound({
        ...foundForm,
        age: Number(foundForm.age),
        foundTime: foundForm.foundTime || new Date().toISOString(),
        lat: useLocation && userLocation ? userLocation.lat : null,
        lng: useLocation && userLocation ? userLocation.lng : null,
      });
      setSubmittedId(result.id);
      setSubmittedType("found");
      setFoundForm({
        age: "",
        gender: "female",
        foundLocationName: "",
        foundTime: "",
        description: "",
        finderContact: "",
      });
      loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit found report. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const filteredMissing = allMissing.filter((m) => {
    const matchesQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lastSeenLocationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === "all" || m.gender === genderFilter;
    return matchesQuery && matchesGender;
  });

  const filteredFound = allFound.filter((f) => {
    const matchesQuery =
      f.foundLocationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === "all" || f.gender === genderFilter;
    return matchesQuery && matchesGender;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6"
    >
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 bottom-0 opacity-5 translate-x-8 translate-y-8 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-amber-400" />
        </div>

        <div className="relative z-10 max-w-xl space-y-2.5">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Matching Network Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Lost &amp; Found Safety Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Report a missing pilgrim or a found person. Our similarity engine automatically compares facial tags, physical descriptions, locations, and timestamps across the entire Simhasth 2028 network.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-amber-200">
            <span className="flex items-center gap-1 font-bold">
              <Phone className="w-3.5 h-3.5" /> Helpline: <strong>1077</strong>
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-300">24/7 Simhasth Police Control Room</span>
          </div>
        </div>
      </div>

      {/* Main Tab Segmented Controls with Framer Motion Sliding Pill */}
      <div className="grid grid-cols-3 bg-slate-200/80 p-1.5 rounded-2xl shadow-inner border border-slate-300/60 gap-1.5 relative">
        <button
          onClick={() => {
            setTab("missing");
            setSubmittedId(null);
          }}
          className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
            tab === "missing" ? "text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {tab === "missing" && (
            <motion.div
              layoutId="lostFoundTab"
              className="absolute inset-0 bg-rose-600 rounded-xl shadow-md"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <UserX className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Report Missing</span>
        </button>

        <button
          onClick={() => {
            setTab("found");
            setSubmittedId(null);
          }}
          className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
            tab === "found" ? "text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {tab === "found" && (
            <motion.div
              layoutId="lostFoundTab"
              className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <UserCheck className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Report Found</span>
        </button>

        <button
          onClick={() => {
            setTab("browse");
            setSubmittedId(null);
          }}
          className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
            tab === "browse" ? "text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {tab === "browse" && (
            <motion.div
              layoutId="lostFoundTab"
              className="absolute inset-0 bg-slate-900 rounded-xl shadow-md"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Search className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Feed ({allMissing.length + allFound.length})</span>
        </button>
      </div>

      {/* Success Modal / Banner */}
      <AnimatePresence>
        {submittedId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-extrabold text-base text-emerald-950">
                  {submittedType === "missing" ? "Missing Person Report Broadcasted!" : "Found Person Report Registered!"}
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your report has been logged with Reference ID: <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-950">{submittedId}</strong>.
                  The system is actively scanning for matches and notifying the nearest Simhasth Police booth.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">Need immediate help? Call the Control Center at <strong>1077</strong>.</span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setTab("browse");
                  setSubmittedId(null);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                View in Live Feed
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold rounded-2xl p-4 flex items-center gap-3 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: REPORT MISSING PERSON */}
      {tab === "missing" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onSubmit={submitMissing}
          className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <UserX className="w-5 h-5" />
              <span>Step 1: Missing Person Details</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Please provide as much specific detail as possible.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name (पूरा नाम) *</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                value={missingForm.name}
                onChange={(e) => setMissingForm({ ...missingForm, name: e.target.value })}
                placeholder="e.g. Ramesh Chandra Sharma"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Age (उम्र) *</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={120}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  value={missingForm.age}
                  onChange={(e) => setMissingForm({ ...missingForm, age: e.target.value })}
                  placeholder="e.g. 58"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gender (लिंग) *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  value={missingForm.gender}
                  onChange={(e) => setMissingForm({ ...missingForm, gender: e.target.value })}
                >
                  <option value="female">Female (महिला)</option>
                  <option value="male">Male (पुरुष)</option>
                  <option value="other">Child / Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Last Seen Location (अंतिम बार कहाँ देखा) *</label>
                <button
                  type="button"
                  onClick={() => handleUseGpsForLocation(true)}
                  className="text-xs text-amber-700 font-semibold hover:text-amber-900 flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Auto-fill My GPS
                </button>
              </div>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                value={missingForm.lastSeenLocationName}
                onChange={(e) => setMissingForm({ ...missingForm, lastSeenLocationName: e.target.value })}
                placeholder="e.g. Near Ram Ghat, Pillar No. 14, Food Bhandara"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Last Seen Time (समय)</label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  value={missingForm.lastSeenTime}
                  onChange={(e) => setMissingForm({ ...missingForm, lastSeenTime: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Mobile Number (संपर्क नंबर) *</label>
                <input
                  required
                  type="tel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  value={missingForm.reporterContact}
                  onChange={(e) => setMissingForm({ ...missingForm, reporterContact: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Clothing &amp; Appearance Description (पहनावा, रंग, भाषा, विशेष पहचान) *
              </label>
              <textarea
                required
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                value={missingForm.description}
                onChange={(e) => setMissingForm({ ...missingForm, description: e.target.value })}
                placeholder="e.g. Wearing yellow kurta, white dhoti, spectacles, speaks Hindi & Gujarati, has rudraksha mala..."
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Attach live GPS coordinates to this report</span>
            </label>
            <span className="text-[11px] text-slate-400 font-semibold">{userLocation ? "📍 GPS Active" : "⚠️ GPS Inactive"}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-shadow"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserX className="w-5 h-5" />
                <span>Submit Missing Person Alert</span>
              </>
            )}
          </motion.button>
        </motion.form>
      )}

      {/* TAB 2: REPORT FOUND PERSON */}
      {tab === "found" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onSubmit={submitFound}
          className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <UserCheck className="w-5 h-5" />
              <span>Step 1: Found Person Details</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Help connect lost pilgrims back to their guardians.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Approximate Age (अनुमानित उम्र) *</label>
              <input
                required
                type="number"
                min={1}
                max={120}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={foundForm.age}
                onChange={(e) => setFoundForm({ ...foundForm, age: e.target.value })}
                placeholder="e.g. 7"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Gender (लिंग) *</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={foundForm.gender}
                onChange={(e) => setFoundForm({ ...foundForm, gender: e.target.value })}
              >
                <option value="female">Female (महिला / बच्ची)</option>
                <option value="male">Male (पुरुष / बच्चा)</option>
                <option value="other">Other / Not sure</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Where Did You Find Them? (कहाँ मिले) *</label>
                <button
                  type="button"
                  onClick={() => handleUseGpsForLocation(false)}
                  className="text-xs text-amber-700 font-semibold hover:text-amber-900 flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Auto-fill My GPS
                </button>
              </div>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={foundForm.foundLocationName}
                onChange={(e) => setFoundForm({ ...foundForm, foundLocationName: e.target.value })}
                placeholder="e.g. Mahakal Main Gate No. 2, Help Desk"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Found Time (समय)</label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  value={foundForm.foundTime}
                  onChange={(e) => setFoundForm({ ...foundForm, foundTime: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Contact / Police Station No. *</label>
                <input
                  required
                  type="tel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  value={foundForm.finderContact}
                  onChange={(e) => setFoundForm({ ...foundForm, finderContact: e.target.value })}
                  placeholder="e.g. +91 98260 11111 / Police Camp 4"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Description of Found Person (कपड़े, पहचान, बोली, स्थिति) *
              </label>
              <textarea
                required
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={foundForm.description}
                onChange={(e) => setFoundForm({ ...foundForm, description: e.target.value })}
                placeholder="e.g. Blue shirt, cannot speak clearly, answered name as 'Sonu', safe at Mahakal Police Chowki..."
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Attach live GPS coordinates to this report</span>
            </label>
            <span className="text-[11px] text-slate-400 font-semibold">{userLocation ? "📍 GPS Active" : "⚠️ GPS Inactive"}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-shadow"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                <span>Submit Found Person Report</span>
              </>
            )}
          </motion.button>
        </motion.form>
      )}

      {/* TAB 3: BROWSE COMMUNITY REPORTS FEED */}
      {tab === "browse" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="space-y-4"
        >
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, location, or description..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all"
              >
                <option value="all">All Genders</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>

          {/* Missing Persons Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
              <UserX className="w-4 h-4" />
              <span>Active Missing Cases ({filteredMissing.length})</span>
            </div>

            {filteredMissing.length === 0 ? (
              <p className="bg-white p-4 rounded-xl text-xs text-slate-400 text-center border border-slate-200">
                No missing cases matching your search criteria.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMissing.map((m) => (
                  <motion.div
                    key={m.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100 hover:border-rose-300 transition-all space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                          MISSING &bull; {m.age} Yrs &bull; {m.gender.toUpperCase()}
                        </span>
                        <h4 className="font-bold text-base text-slate-900 mt-1">{m.name}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(m.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Last seen: <strong>{m.lastSeenLocationName || "Unknown"}</strong></span>
                      </p>
                      {m.description && (
                        <p className="bg-slate-50 p-2 rounded-lg text-slate-600 italic">
                          "{m.description}"
                        </p>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Contact: {m.reporterContact}</span>
                      <a
                        href={`tel:${m.reporterContact}`}
                        className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call Reporter
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Found Persons Grid */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <UserCheck className="w-4 h-4" />
              <span>Registered Found Persons ({filteredFound.length})</span>
            </div>

            {filteredFound.length === 0 ? (
              <p className="bg-white p-4 rounded-xl text-xs text-slate-400 text-center border border-slate-200">
                No found reports registered.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFound.map((f) => (
                  <motion.div
                    key={f.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 hover:border-emerald-300 transition-all space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          FOUND &bull; ~{f.age} Yrs &bull; {f.gender.toUpperCase()}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">Person at {f.foundLocationName}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(f.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Found at: <strong>{f.foundLocationName}</strong></span>
                      </p>
                      {f.description && (
                        <p className="bg-slate-50 p-2 rounded-lg text-slate-600 italic">
                          "{f.description}"
                        </p>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Finder: {f.finderContact}</span>
                      <a
                        href={`tel:${f.finderContact}`}
                        className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call Finder
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
