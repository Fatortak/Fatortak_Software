import React, { useEffect, useState } from "react";
import {
  Activity,
  Database,
  RefreshCw,
  Server,
  UserCheck,
  Users,
} from "lucide-react";
import { apiClient } from "@/services/api";

interface InstallationStats {
  selfHosted: boolean;
  registrationEnabled: boolean;
  generatedAt: string;
  users: {
    total: number;
    active: number;
    online: number;
    registeredLast30Days: number;
  };
  data: Record<string, number>;
  sessions: {
    total: number;
    active: number;
    recent: Array<{
      id: string;
      userName: string;
      ipAddress?: string;
      createdAt: string;
      lastSeenAt: string;
      expiresAt: string;
      revokedAt?: string;
    }>;
  };
  system: {
    version: string;
    runtime: string;
    environment: string;
    databaseProvider?: string;
    latestMigration?: string;
    backup: {
      configured: boolean;
      status: string;
      directory?: string;
      lastBackupAt?: string;
      fileName?: string;
      ageDays?: number;
    };
  };
  recentUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string;
    lastSeenAt?: string;
  }>;
}

const statIcons = [Users, UserCheck, Activity, Database];

const parseUtc = (value?: string | null) => {
  if (!value) return null;
  const normalized = /Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
  return new Date(normalized);
};

const InstallationInsights = () => {
  const [stats, setStats] = useState<InstallationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    const result = await apiClient.get<InstallationStats>("/api/self-hosted/stats");
    if (result.success && result.data) {
      setStats(result.data);
    } else {
      setError(result.errorMessage || "Unable to load installation statistics.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading installation insights...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        {error || "No installation data available."}
      </div>
    );
  }

  const cards = [
    { label: "Registered users", value: stats.users.total },
    { label: "Active users", value: stats.users.active },
    { label: "Online now (5 min)", value: stats.users.online },
    { label: "New in 30 days", value: stats.users.registeredLast30Days },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-canvas p-4 sm:p-6 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Installation insights
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {stats.selfHosted
              ? "A self-hosted reference for registered users, online sessions and stored data. No tenant or subscription limits apply in self-hosted mode."
              : "A tenant-scoped view of registered users, online sessions and stored records."}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = statIcons[index];
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Deployment
            </h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Mode" value={stats.selfHosted ? "Self-hosted" : "Multi-tenant SaaS"} />
            <Row label="Registration" value={stats.registrationEnabled ? "Open" : "Admin only"} />
            <Row label="Generated" value={parseUtc(stats.generatedAt)?.toLocaleString() ?? "—"} />
            <Row label="Tenants" value={String(stats.data.tenants ?? 1)} />
            <Row label="Version" value={stats.system?.version ?? "—"} />
            <Row label="Runtime" value={stats.system?.runtime ?? "—"} />
            <Row label="Environment" value={stats.system?.environment ?? "—"} />
            <Row label="Latest migration" value={stats.system?.latestMigration ?? "—"} />
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Stored data
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {Object.entries(stats.data)
              .filter(([key]) => key !== "tenants")
              .map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70"
                >
                  <div className="text-xs capitalize text-slate-500">
                    {key.replace(/([A-Z])/g, " $1")}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {value}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Sessions
            </h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Active sessions" value={String(stats.sessions?.active ?? 0)} />
            <Row label="Recorded sessions" value={String(stats.sessions?.total ?? 0)} />
            <Row
              label="Most recent activity"
              value={
                parseUtc(stats.sessions?.recent?.[0]?.lastSeenAt)?.toLocaleString() ??
                "—"
              }
            />
          </dl>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Users can review and revoke their own devices from Sessions &amp; Devices.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Backup and upgrade
            </h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Backup status" value={stats.system?.backup?.status ?? "NotConfigured"} />
            <Row label="Backup directory" value={stats.system?.backup?.directory ?? "Not configured"} />
            <Row label="Latest backup" value={stats.system?.backup?.fileName ?? "—"} />
            <Row
              label="Backup time"
              value={
                parseUtc(stats.system?.backup?.lastBackupAt)?.toLocaleString() ?? "—"
              }
            />
            <Row label="Database" value={stats.system?.databaseProvider ?? "—"} />
          </dl>
          {!stats.system?.backup?.configured && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              Set <code>SelfHosted:BackupDirectory</code> to a folder containing
              <code className="mx-1">.bak</code> files to track backup freshness here.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Recent registered users
          </h2>
          <span className="text-xs text-slate-500">
            Online = active in the last 5 minutes
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Registered</th>
                <th className="px-5 py-3">Last seen</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentUsers.map((user) => {
                const lastSeen = parseUtc(user.lastSeenAt);
                const online =
                  lastSeen !== null &&
                  Date.now() - lastSeen.getTime() < 5 * 60 * 1000;
                return (
                  <tr key={user.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {user.role}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {parseUtc(user.createdAt)?.toLocaleDateString() ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {lastSeen?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          online
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            online ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {online ? "Online" : "Offline"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-medium text-slate-900 dark:text-white">{value}</dd>
  </div>
);

export default InstallationInsights;
