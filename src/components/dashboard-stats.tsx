// used
"use client";

import { useEffect, useState } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "danger";
}

const colorClasses = {
  primary: "bg-blue-50 border-blue-200",
  success: "bg-green-50 border-green-200",
  warning: "bg-yellow-50 border-yellow-200",
  danger: "bg-red-50 border-red-200",
};

function StatsCard({
  title,
  value,
  subtext,
  icon,
  trend,
  color = "primary",
}: StatsCardProps) {
  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-6`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
      )}
    </div>
  );
}

interface DashboardStatsProps {
  organizationId: string;
  websiteId?: string | null;
}

export function DashboardStats({
  organizationId,
  websiteId,
}: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    averageResolutionTime: 0,
  });
  const [statusCounts, setStatusCounts] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsUrl = `/api/admin/stats?orgId=${organizationId}${
          websiteId ? `&websiteId=${websiteId}` : ""
        }`;

        const response = await fetch(statsUrl);
        const data = await response.json();

        if (response.ok) {
          setStats(data.stats);
          setStatusCounts(data.statusCounts);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load stats:", error);
        setLoading(false);
      }
    };

    loadStats();
  }, [organizationId, websiteId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tickets"
          value={stats.totalTickets}
          subtext="All time"
          color="primary"
        />
        <StatsCard
          title="Open Tickets"
          value={stats.openTickets}
          subtext="Requires attention"
          color="warning"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolvedTickets}
          subtext="Successfully closed"
          color="success"
        />
        <StatsCard
          title="Avg Resolution"
          value={`${stats.averageResolutionTime}h`}
          subtext="Average time to resolve"
          color="primary"
        />
      </div>

      {/* Status breakdown */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">
          Ticket Status Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50">
            <p className="text-2xl font-bold text-blue-600">
              {statusCounts.open}
            </p>
            <p className="text-sm text-muted-foreground">Open</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-yellow-50">
            <p className="text-2xl font-bold text-yellow-600">
              {statusCounts.inProgress}
            </p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50">
            <p className="text-2xl font-bold text-green-600">
              {statusCounts.resolved}
            </p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-gray-600">
              {statusCounts.closed}
            </p>
            <p className="text-sm text-muted-foreground">Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
