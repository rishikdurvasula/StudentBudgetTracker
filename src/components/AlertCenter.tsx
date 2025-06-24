"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BudgetAlert {
  id: string;
  type: string;
  message: string;
  amount: number;
  budget: number;
  percentage: number;
  isRead: boolean;
  createdAt: string;
}

interface WeeklyDigest {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
  message: string;
  createdAt: string;
}

export function AlertCenter() {
  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alertsData = { alerts: [] }, isLoading: alertsLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => await fetch("/api/alerts").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch digests
  const { data: digestsData = { digests: [] }, isLoading: digestsLoading } = useQuery({
    queryKey: ["digests"],
    queryFn: async () => await fetch("/api/digests").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  // Mark alert as read mutation
  const markAlertAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      return alertId;
    },
    onSuccess: (alertId) => {
      queryClient.setQueryData(["alerts"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          alerts: oldData.alerts.map((alert: any) =>
            alert.id === alertId ? { ...alert, isRead: true } : alert
          ),
        };
      });
    },
  });

  const alerts = alertsData.alerts || [];
  const digests = digestsData.digests || [];
  const unreadAlerts = useMemo(() => alerts.filter((alert: BudgetAlert) => !alert.isRead), [alerts]);

  if (alertsLoading || digestsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts & Digests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Budget Alerts
            {unreadAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No budget alerts</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert: BudgetAlert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : alert.type === 'budget_exceeded'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {alert.type === 'budget_exceeded' ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          alert.isRead ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {alert.message}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(alert.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={alert.type === 'budget_exceeded' ? 'destructive' : 'secondary'}>
                            {alert.percentage.toFixed(1)}% used
                          </Badge>
                          {!alert.isRead && (
                            <Badge variant="outline">New</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAlertAsReadMutation.mutate(alert.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Digests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Digests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {digests.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No weekly digests yet</p>
          ) : (
            <div className="space-y-4">
              {digests.map((digest: WeeklyDigest) => (
                <div key={digest.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{digest.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Week of {format(new Date(digest.weekStart), "MMM d")} - {format(new Date(digest.weekEnd), "MMM d, yyyy")}
                      </p>
                      {Object.keys(digest.categoryBreakdown).length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Category Breakdown:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(digest.categoryBreakdown).map(([category, amount]) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}: ${typeof amount === 'number' ? amount.toFixed(2) : amount}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 