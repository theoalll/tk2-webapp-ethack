"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/ToastProvider";

interface CourseDetail {
  id: string;
  code: string;
  name: string;
  credits: number;
  lecturer: string;
  schedule: string;
  description: string;
  isHidden: boolean;
  isDummy: boolean;
  flag?: string;
  isEnrolled: boolean;
  enrollmentStatus: string | null;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  gpa: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) throw new Error("Unauthorized");
        const userData = await userRes.json();
        setUser(userData);

        const courseRes = await fetch(`/api/courses/${params.id}`);
        if (courseRes.status === 404) {
          setNotFound(true);
          return;
        }
        if (courseRes.status === 403) {
          addToast("Anda tidak memiliki akses ke mata kuliah ini", "error");
          router.push("/courses");
          return;
        }
        if (!courseRes.ok) throw new Error("Failed to fetch");
        const courseData = await courseRes.json();
        setCourse(courseData);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router, addToast]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Mata Kuliah Tidak Ditemukan
          </h1>
          <p className="mt-2 text-gray-500">Mata kuliah yang Anda cari tidak tersedia.</p>
          <button
            onClick={() => router.push("/courses")}
            className="mt-4 rounded-lg bg-siak-700 px-4 py-2 text-sm font-medium text-white"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }
  if (!course || !user) return null;

  return (
    <>
      <Navbar userName={user.name} userRole={user.role} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/courses")}
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Kembali ke katalog
        </button>

        <div
          className={`rounded-xl border bg-white p-8 ${
            course.isHidden ? "border-red-200" : "border-gray-200"
          }`}
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-siak-600">{course.code}</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                {course.name}
              </h1>
            </div>
            {course.isHidden && (
              <span className="rounded bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
                CLASSIFIED
              </span>
            )}
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <InfoItem label="SKS" value={`${course.credits} SKS`} />
            <InfoItem label="Dosen Pengampu" value={course.lecturer} />
            <InfoItem label="Jadwal" value={course.schedule} />
            <InfoItem
              label="Status Pendaftaran"
              value={course.isEnrolled ? "Terdaftar" : "Belum Terdaftar"}
            />
            {course.enrollmentStatus && (
              <InfoItem
                label="Status IRS"
                value={
                  course.enrollmentStatus === "SUBMITTED"
                    ? "Telah Disubmit"
                    : "Draft"
                }
              />
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Deskripsi Mata Kuliah
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {course.description}
            </p>
          </div>

          {course.isHidden && course.isEnrolled && course.flag && (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Flag / Credential
              </h2>
              <p className="mt-3 font-mono text-lg font-bold text-emerald-800">
                {course.flag}
              </p>
              <p className="mt-2 text-xs text-emerald-600">
                Selamat! Anda berhasil mengakses mata kuliah ini.
              </p>
            </div>
          )}

          {course.isHidden && !course.isEnrolled && (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-700">
                Anda tidak terdaftar pada mata kuliah ini. Silakan daftar melalui
                katalog mata kuliah.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
