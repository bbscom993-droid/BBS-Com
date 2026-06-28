import React, { useState } from "react";
import * as Icons from "lucide-react";
import { RFQ } from "../types";

interface ManualScheduleFormProps {
  rfqs: RFQ[];
  reminders: any[];
  onScheduled: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function ManualScheduleForm({
  rfqs,
  reminders,
  onScheduled,
  showToast
}: ManualScheduleFormProps) {
  const [selectedRfqId, setSelectedRfqId] = useState("");
  const [delayHours, setDelayHours] = useState(48);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter RFQs that are unquoted/pending and don't already have an active scheduled reminder
  const eligibleRfqs = rfqs.filter((rfq) => {
    // Must be pending or processing
    if (rfq.status !== "pending" && rfq.status !== "processing") return false;
    
    // Must not have an active scheduled reminder
    const hasScheduledReminder = reminders.some(
      (r) => r.rfqId === rfq.id && r.status === "scheduled"
    );
    return !hasScheduledReminder;
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqId) {
      showToast("Pilih salah satu RFQ terlebih dahulu.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: selectedRfqId,
          delayHours,
          subject: subject.trim() || undefined,
          body: body.trim() || undefined
        })
      });

      if (res.ok) {
        showToast("Jadwal follow-up berhasil ditambahkan!", "success");
        // Reset form
        setSelectedRfqId("");
        setDelayHours(48);
        setSubject("");
        setBody("");
        onScheduled();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Gagal menjadwalkan reminder.", "error");
      }
    } catch (err) {
      showToast("Koneksi API bermasalah.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill fields when RFQ selection changes
  const handleRfqChange = (rfqId: string) => {
    setSelectedRfqId(rfqId);
    if (!rfqId) {
      setSubject("");
      setBody("");
      return;
    }
    const rfq = rfqs.find(r => r.id === rfqId);
    if (rfq) {
      setSubject(`[PENGINGAT] Permintaan Penawaran ${rfq.rfqNumber} - Segera Kami Selesaikan`);
      setBody(`Halo ${rfq.clientName},\n\nKami ingin menginformasikan kembali bahwa tim teknis Berkah Bintang Solusindo sedang melakukan finalisasi terhadap rincian penawaran harga untuk RFQ ${rfq.rfqNumber}.\n\nKami mohon maaf atas sedikit keterlambatan ini. Kami pastikan Anda mendapatkan rekomendasi spesifikasi barang IT terbaik dengan harga paling kompetitif.\n\nJika ada pertanyaan darurat atau tambahan kebutuhan, mohon jangan ragu untuk menghubungi kami via WhatsApp.`);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
      <div className="border-b border-white/10 pb-4 mb-4">
        <h4 className="font-extrabold text-white text-base flex items-center space-x-2">
          <Icons.Plus className="h-5 w-5 text-indigo-400" />
          <span>Jadwalkan Follow-up Manual</span>
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Buat atau jadwalkan email tindak lanjut spesifik untuk salah satu klien RFQ secara manual.
        </p>
      </div>

      <form onSubmit={handleSchedule} className="space-y-4 text-xs">
        {/* RFQ Selector */}
        <div>
          <label className="block text-slate-300 font-bold mb-1.5">Pilih RFQ Aktif Klien</label>
          <select
            value={selectedRfqId}
            onChange={(e) => handleRfqChange(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none transition-all text-xs"
          >
            <option value="">-- Pilih RFQ Pending Klien --</option>
            {eligibleRfqs.map((rfq) => (
              <option key={rfq.id} value={rfq.id} className="bg-slate-900 text-white">
                {rfq.rfqNumber} - {rfq.clientName} ({rfq.companyName || "Instansi"})
              </option>
            ))}
          </select>
          {eligibleRfqs.length === 0 && (
            <p className="text-[10px] text-amber-500/80 mt-1.5">
              💡 Tidak ada RFQ yang berstatus pending/unquoted tanpa jadwal pengingat aktif saat ini.
            </p>
          )}
        </div>

        {selectedRfqId && (
          <>
            {/* Custom Delay */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Jadwalkan Kirim Dalam</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDelayHours(48)}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                    delayHours === 48
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  48 Jam (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setDelayHours(0.0167)} // ~1 minute
                  className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                    delayHours < 1
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  ⚡ Simulasi (1 Mnt)
                </button>
              </div>
              
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={delayHours}
                  onChange={(e) => setDelayHours(parseFloat(e.target.value) || 48)}
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-white font-mono placeholder-slate-600 focus:outline-none transition-all text-xs"
                />
                <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-slate-400 flex items-center font-bold">
                  Jam
                </div>
              </div>
            </div>

            {/* Custom Subject */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Kustomisasi Subjek Email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-all text-xs"
                placeholder="Subjek email..."
                required
              />
            </div>

            {/* Custom Body */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Kustomisasi Isi Pesan</label>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition-all text-xs font-sans resize-none"
                placeholder="Tulis pesan..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl border border-indigo-500/30 transition-all shadow-lg hover:shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Icons.RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icons.Calendar className="h-4 w-4" />
                  <span>Jadwalkan Pengingat</span>
                </>
              )}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
