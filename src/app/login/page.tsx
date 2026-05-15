"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      addToast("Selamat datang di SIAK Next Gen!", "success");
      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-siak-900 via-siak-800 to-siak-950 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-lg font-bold backdrop-blur">
              SG
            </div>
            <div>
              <h1 className="text-xl font-bold">SIAK Next Gen</h1>
              <p className="text-sm text-siak-300">v2.0</p>
            </div>
          </div>
          <div className="mt-20">
            <h2 className="text-3xl font-bold leading-tight">
              Sistem Informasi
              <br />
              Akademik Terintegrasi
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-siak-200">
              Kelola perencanaan studi, registrasi mata kuliah, dan pantau
              perkembangan akademik Anda dalam satu platform.
            </p>
          </div>
        </div>
        <div className="text-sm text-siak-400">
          &copy; {new Date().getFullYear()} Universitas Indonesia. All rights
          reserved.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-siak-700 text-lg font-bold text-white">
              SG
            </div>
            <h1 className="text-xl font-bold text-siak-800">
              SIAK Next Gen
            </h1>
            <p className="text-sm text-gray-500">Sistem Informasi Akademik</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Masuk</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gunakan akun SSO Universitas Anda
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email SSO
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@student.ui.ac.id"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-siak-500 focus:outline-none focus:ring-2 focus:ring-siak-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-siak-500 focus:outline-none focus:ring-2 focus:ring-siak-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-siak-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-siak-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Akun Demo
            </p>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <p>
                <span className="font-medium">Mahasiswa:</span>{" "}
                mahasiswa@student.ui.ac.id
              </p>
              <p>
                <span className="font-medium">Admin:</span> admin@siak.ui.ac.id
              </p>
              <p>
                <span className="font-medium">Password:</span> password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
