"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/ToastProvider";

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  lecturer: string;
  schedule: string;
  description: string;
  isHidden: boolean;
  isDummy: boolean;
  isEnrolled: boolean;
  canEnroll: boolean;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  gpa: number;
  currentSKS: number;
  maxSKS: number;
  isSubmitted: boolean;
}

export default function CoursesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, coursesRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/courses"),
      ]);
      if (!userRes.ok || !coursesRes.ok) throw new Error("Unauthorized");
      const [userData, coursesData] = await Promise.all([
        userRes.json(),
        coursesRes.json(),
      ]);
      setUser(userData);
      setCourses(coursesData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (course: Course) => {
    setActionLoading(course.id);
    try {
      const res = await fetch("/api/irs/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Gagal menambahkan", "error");
      } else {
        addToast(data.message || `Berhasil menambahkan ${course.code}`, "success");
      }
      await fetchData();
    } catch {
      addToast("Terjadi kesalahan", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrop = async (course: Course) => {
    setActionLoading(course.id);
    try {
      const res = await fetch("/api/irs/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Gagal menghapus", "error");
      } else {
        addToast(data.message || `Berhasil menghapus ${course.code}`, "info");
      }
      await fetchData();
    } catch {
      addToast("Terjadi kesalahan", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return null;

  const canAddMore = user.currentSKS < user.maxSKS;

  const normalCourses = courses.filter((c) => !c.isHidden && !c.isDummy);
  const specialCourses = courses.filter((c) => c.isHidden || c.isDummy);

  return (
    <>
      <Navbar userName={user.name} userRole={user.role} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Katalog Mata Kuliah
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            SKS saat ini: {user.currentSKS} / {user.maxSKS}
            {user.isSubmitted && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                IRS Terkunci
              </span>
            )}
          </p>
        </div>

        {specialCourses.length > 0 && (
          <>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Mata Kuliah Khusus
            </h2>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specialCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  user={user}
                  canAddMore={canAddMore}
                  actionLoading={actionLoading}
                  onAdd={handleAdd}
                  onDrop={handleDrop}
                  isSpecial
                />
              ))}
            </div>
          </>
        )}

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Mata Kuliah Reguler
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {normalCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              user={user}
              canAddMore={canAddMore}
              actionLoading={actionLoading}
              onAdd={handleAdd}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </main>
    </>
  );
}

function CourseCard({
  course,
  user,
  canAddMore,
  actionLoading,
  onAdd,
  onDrop,
  isSpecial,
}: {
  course: Course;
  user: UserData;
  canAddMore: boolean;
  actionLoading: string | null;
  onAdd: (course: Course) => void;
  onDrop: (course: Course) => void;
  isSpecial?: boolean;
}) {
  const adding = actionLoading === course.id;

  return (
    <div
      className={`group relative rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${
        course.isHidden
          ? "border-red-300 bg-red-50/30"
          : course.isDummy
            ? "border-amber-300 bg-amber-50/30"
            : "border-gray-200"
      }`}
    >
      {course.isHidden && (
        <div className="absolute right-3 top-3">
          <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
            CLASSIFIED
          </span>
        </div>
      )}
      {course.isDummy && !course.isHidden && (
        <div className="absolute right-3 top-3">
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            PILIHAN KHUSUS
          </span>
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs font-medium text-siak-600">{course.code}</p>
        <h3 className="mt-0.5 text-base font-semibold text-gray-900">
          {course.name}
        </h3>
      </div>

      <div className="mb-4 space-y-1 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gray-400" />
          {course.credits} SKS
        </p>
        <p className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gray-400" />
          {course.lecturer}
        </p>
        <p className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gray-400" />
          {course.schedule}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {course.isEnrolled ? (
          <button
            onClick={() => onDrop(course)}
            disabled={adding || user.isSubmitted}
            className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {adding ? "Memproses..." : "Drop"}
          </button>
        ) : (
          <button
            onClick={() => onAdd(course)}
            disabled={adding || !canAddMore || user.isSubmitted}
            className="flex-1 rounded-lg bg-siak-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-siak-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {adding ? "Memproses..." : "Tambah"}
          </button>
        )}
        <a
          href={`/courses/${course.id}`}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Detail
        </a>
      </div>
    </div>
  );
}
