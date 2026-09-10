import { useState } from "react";
import { api } from "../api";

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

type Tab = "missing" | "found";

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400";
const labelCls = "text-xs font-medium text-gray-600 mb-1 block";

export default function LostFound({ userLocation }: Props) {
  const [tab, setTab] = useState<Tab>("missing");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(true);

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

  const submitMissing = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.reportMissing({
        ...missingForm,
        age: Number(missingForm.age),
        lastSeenTime: missingForm.lastSeenTime || new Date().toISOString(),
        lat: useLocation && userLocation ? userLocation.lat : null,
        lng: useLocation && userLocation ? userLocation.lng : null,
      });
      setSubmitted("missing");
      setMissingForm({
        name: "",
        age: "",
        gender: "female",
        lastSeenLocationName: "",
        lastSeenTime: "",
        description: "",
        reporterContact: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    }
  };

  const submitFound = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.reportFound({
        ...foundForm,
        age: Number(foundForm.age),
        foundTime: foundForm.foundTime || new Date().toISOString(),
        lat: useLocation && userLocation ? userLocation.lat : null,
        lng: useLocation && userLocation ? userLocation.lng : null,
      });
      setSubmitted("found");
      setFoundForm({
        age: "",
        gender: "female",
        foundLocationName: "",
        foundTime: "",
        description: "",
        finderContact: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Lost & Found</h2>
        <p className="text-sm text-gray-500">Report a missing pilgrim or a person you found. Our AI matches reports automatically.</p>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-300">
        <button
          onClick={() => {
            setTab("missing");
            setSubmitted(null);
          }}
          className={`flex-1 py-2 text-sm font-semibold ${tab === "missing" ? "bg-red-500 text-white" : "bg-white text-gray-600"}`}
        >
          Report Missing
        </button>
        <button
          onClick={() => {
            setTab("found");
            setSubmitted(null);
          }}
          className={`flex-1 py-2 text-sm font-semibold ${tab === "found" ? "bg-green-600 text-white" : "bg-white text-gray-600"}`}
        >
          Found Someone
        </button>
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-sm rounded-lg px-3 py-2">
          {submitted === "missing" ? "Missing person report submitted." : "Found person report submitted."} Thank you —
          check Admin view for possible matches.
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      <label className="flex items-center gap-2 text-xs text-gray-500">
        <input type="checkbox" checked={useLocation} onChange={(e) => setUseLocation(e.target.checked)} />
        Attach my current GPS location {!userLocation && "(unavailable)"}
      </label>

      {tab === "missing" ? (
        <form onSubmit={submitMissing} className="space-y-3 bg-white rounded-xl shadow p-4">
          <div>
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              value={missingForm.name}
              onChange={(e) => setMissingForm({ ...missingForm, name: e.target.value })}
              placeholder="Full name (if known)"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Age *</label>
              <input
                required
                type="number"
                min={0}
                className={inputCls}
                value={missingForm.age}
                onChange={(e) => setMissingForm({ ...missingForm, age: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Gender *</label>
              <select
                className={inputCls}
                value={missingForm.gender}
                onChange={(e) => setMissingForm({ ...missingForm, gender: e.target.value })}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Last seen location</label>
            <input
              className={inputCls}
              value={missingForm.lastSeenLocationName}
              onChange={(e) => setMissingForm({ ...missingForm, lastSeenLocationName: e.target.value })}
              placeholder="e.g. Ram Ghat, near Parking Zone A"
            />
          </div>
          <div>
            <label className={labelCls}>Last seen time</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={missingForm.lastSeenTime}
              onChange={(e) => setMissingForm({ ...missingForm, lastSeenTime: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={inputCls}
              rows={2}
              value={missingForm.description}
              onChange={(e) => setMissingForm({ ...missingForm, description: e.target.value })}
              placeholder="Clothing, height, distinguishing marks..."
            />
          </div>
          <div>
            <label className={labelCls}>Your contact number *</label>
            <input
              required
              className={inputCls}
              value={missingForm.reporterContact}
              onChange={(e) => setMissingForm({ ...missingForm, reporterContact: e.target.value })}
            />
          </div>
          <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg text-sm">
            Submit Missing Report
          </button>
        </form>
      ) : (
        <form onSubmit={submitFound} className="space-y-3 bg-white rounded-xl shadow p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Approx. Age *</label>
              <input
                required
                type="number"
                min={0}
                className={inputCls}
                value={foundForm.age}
                onChange={(e) => setFoundForm({ ...foundForm, age: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Gender *</label>
              <select
                className={inputCls}
                value={foundForm.gender}
                onChange={(e) => setFoundForm({ ...foundForm, gender: e.target.value })}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Found location</label>
            <input
              className={inputCls}
              value={foundForm.foundLocationName}
              onChange={(e) => setFoundForm({ ...foundForm, foundLocationName: e.target.value })}
              placeholder="e.g. Mahakal Main Gate"
            />
          </div>
          <div>
            <label className={labelCls}>Found time</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={foundForm.foundTime}
              onChange={(e) => setFoundForm({ ...foundForm, foundTime: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={inputCls}
              rows={2}
              value={foundForm.description}
              onChange={(e) => setFoundForm({ ...foundForm, description: e.target.value })}
              placeholder="Clothing, height, distinguishing marks..."
            />
          </div>
          <div>
            <label className={labelCls}>Your contact number *</label>
            <input
              required
              className={inputCls}
              value={foundForm.finderContact}
              onChange={(e) => setFoundForm({ ...foundForm, finderContact: e.target.value })}
            />
          </div>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm">
            Submit Found Report
          </button>
        </form>
      )}
    </div>
  );
}
