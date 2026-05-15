"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

interface UserData {
  id: string;
  email: string;
  name: string;
  nim: string;
  gpa: number;
  role: string;
  currentSKS: number;
  submittedSKS: number;
  maxSKS: number;
  enrollmentCount: number;
  submittedCount: number;
  isSubmitted: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return null;

  const sksPercent = (user.isSubmitted ? user.submittedSKS : user.currentSKS) / user.maxSKS * 100;

  return (
    <>
      <Navbar userName={user.name} userRole={user.role} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Selamat datang di sistem akademik, {user.name}.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="IP Semester"
            value={user.gpa.toFixed(2)}
            subtitle={user.gpa >= 3.5 ? "Cumlaude" : "Baik"}
            accent={user.gpa >= 3.5 ? "emerald" : "amber"}
          />
          <StatCard
            label="SKS Saat Ini"
            value={`${user.isSubmitted ? user.submittedSKS : user.currentSKS}`}
            subtitle={`Maksimal ${user.maxSKS} SKS`}
            accent={sksPercent > 100 ? "red" : "blue"}
          />
          <StatCard
            label={`${user.isSubmitted ? "IRS Terkirim" : "Mata Kuliah"}`}
            value={`${user.isSubmitted ? user.submittedCount : user.enrollmentCount}`}
            subtitle={user.isSubmitted ? "Mata kuliah" : "Terdaftar"}
            accent="indigo"
          />
          <StatCard
            label="Status IRS"
            value={user.isSubmitted ? "Terkirim" : "Draft"}
            subtitle={user.isSubmitted ? "Telah disubmit" : "Belum disubmit"}
            accent={user.isSubmitted ? "emerald" : "amber"}
          />
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Progress Pengisian IRS
          </h2>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                SKS Terpakai: {user.isSubmitted ? user.submittedSKS : user.currentSKS} / {user.maxSKS}
              </span>
              <span className="font-medium text-gray-900">
                {Math.round(sksPercent)}%
              </span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sksPercent > 100
                    ? "bg-red-500"
                    : sksPercent > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(sksPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="rounded-lg bg-siak-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-siak-800"
            >
              Katalog Mata Kuliah
            </Link>
            <Link
              href="/irs"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Lihat IRS
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle: string;
  accent: "emerald" | "amber" | "blue" | "indigo" | "red";
}) {
  const accentColors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  const dotColors = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    red: "bg-red-500",
  };

  return (
    <div className={`rounded-xl border p-5 ${accentColors[accent]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider opacity-75">
          {label}
        </span>
        <span className={`h-2.5 w-2.5 rounded-full ${dotColors[accent]}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs opacity-75">{subtitle}</p>
    </div>
  );
}
