"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/ToastProvider";

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  createdAt: string;
  course: {
    code: string;
    name: string;
    credits: number;
    lecturer: string;
    schedule: string;
    isHidden: boolean;
    isDummy: boolean;
  };
}

interface IRSData {
  enrollments: Enrollment[];
  totalSKS: number;
  currentSKS: number;
  maxSKS: number;
  isSubmitted: boolean;
  submittedAt: string | null;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  gpa: number;
}

export default function IRSPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [irs, setIrs] = useState<IRSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, irsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/irs/status"),
      ]);
      if (!userRes.ok || !irsRes.ok) throw new Error("Unauthorized");
      const [userData, irsData] = await Promise.all([
        userRes.json(),
        irsRes.json(),
      ]);
      setUser(userData);
      setIrs(irsData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDrop = async (enrollment: Enrollment) => {
    try {
      const res = await fetch("/api/irs/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: enrollment.courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Gagal menghapus", "error");
      } else {
        addToast(data.message || "Berhasil menghapus", "info");
      }
      await fetchData();
    } catch {
      addToast("Terjadi kesalahan", "error");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/irs/submit", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Gagal submit IRS", "error");
      } else {
        addToast(data.message || "IRS berhasil disubmit!", "success");
      }
      await fetchData();
    } catch {
      addToast("Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user || !irs) return null;

  const enrolled = irs.enrollments.filter((e) => e.status === "ENROLLED");
  const submitted = irs.enrollments.filter((e) => e.status === "SUBMITTED");
  const displayEnrollments = irs.isSubmitted ? submitted : enrolled;

  const overLimit = irs.currentSKS > irs.maxSKS;
  const sksPercent = (irs.currentSKS / irs.maxSKS) * 100;

  return (
    <>
      <Navbar userName={user.name} userRole={user.role} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">IRS Saya</h1>
          <p className="mt-1 text-sm text-gray-500">
            Isian Rencana Studi semester ini
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total SKS
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {irs.currentSKS}
              <span className="text-sm font-normal text-gray-500">
                {" "}
                / {irs.maxSKS}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Jumlah Mata Kuliah
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {displayEnrollments.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {irs.isSubmitted ? (
                <span className="text-emerald-600">Telah Disubmit</span>
              ) : (
                <span className="text-amber-600">Draft</span>
              )}
            </p>
            {irs.submittedAt && (
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(irs.submittedAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>

        {!irs.isSubmitted && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress SKS</span>
              <span
                className={`font-medium ${
                  overLimit ? "text-red-600" : "text-gray-900"
                }`}
              >
                {Math.round(sksPercent)}%
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all ${
                  overLimit ? "bg-red-500" : "bg-siak-500"
                }`}
                style={{ width: `${Math.min(sksPercent, 100)}%` }}
              />
            </div>
            {overLimit && (
              <p className="mt-2 text-sm text-red-600">
                SKS melebihi batas maksimal ({irs.maxSKS}). Silakan hapus
                beberapa mata kuliah.
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white">
          {displayEnrollments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Belum ada mata kuliah yang dipilih.</p>
              <button
                onClick={() => router.push("/courses")}
                className="mt-3 rounded-lg bg-siak-700 px-4 py-2 text-sm font-medium text-white"
              >
                Cari Mata Kuliah
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 font-medium text-gray-600">Kode</th>
                    <th className="px-6 py-3 font-medium text-gray-600">
                      Mata Kuliah
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-600">SKS</th>
                    <th className="px-6 py-3 font-medium text-gray-600">
                      Dosen
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    {!irs.isSubmitted && (
                      <th className="px-6 py-3 font-medium text-gray-600">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayEnrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className={`hover:bg-gray-50 ${
                        enrollment.course.isHidden
                          ? "bg-red-50/30"
                          : enrollment.course.isDummy
                            ? "bg-amber-50/30"
                            : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-siak-600">
                        {enrollment.course.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {enrollment.course.name}
                          {enrollment.course.isHidden && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              RESTRICTED
                            </span>
                          )}
                          {enrollment.course.isDummy && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              PILIHAN KHUSUS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{enrollment.course.credits}</td>
                      <td className="max-w-[200px] truncate px-6 py-4 text-gray-600">
                        {enrollment.course.lecturer}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            enrollment.status === "SUBMITTED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {enrollment.status === "SUBMITTED"
                            ? "Terkirim"
                            : "Draft"}
                        </span>
                      </td>
                      {!irs.isSubmitted && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDrop(enrollment)}
                            className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Drop
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          {!irs.isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || displayEnrollments.length === 0 || overLimit}
              className="rounded-lg bg-siak-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-siak-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Menyubmit..." : "Submit IRS"}
            </button>
          ) : (
            <div className="rounded-lg bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-700">
              IRS telah disubmit. Tidak dapat melakukan perubahan.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
