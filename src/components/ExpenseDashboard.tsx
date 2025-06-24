"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapse } from "react-collapse";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from '@tanstack/react-query';

const RANGE_OPTIONS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const CATEGORY_COLORS: Record<string, string> = {
  academic: "#4F46E5",
  groceries: "#22C55E",
  transport: "#F59E0B",
  leisure: "#EC4899",
  rent: "#8B5CF6",
  other: "#6B7280",
};

function groupByCategory(expenses: any[]) {
  const groups: Record<string, { total: number; expenses: any[]; categoryName: string }> = {};
  for (const exp of expenses) {
    const cat = exp.category;
    const catName = cat === "other" ? exp.customCategoryName || "Other" : cat.charAt(0).toUpperCase() + cat.slice(1);
    if (!groups[cat]) {
      groups[cat] = { total: 0, expenses: [], categoryName: catName };
    }
    groups[cat].total += exp.amount;
    groups[cat].expenses.push(exp);
  }
  return groups;
}

export default function ExpenseDashboard() {
  const [range, setRange] = useState("week");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Fetch expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", range],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?range=${range}`);
      const data = await res.json();
      return data.expenses || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["expenses-summary", range],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/summary?range=${range}`);
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Memoize grouping and pieData
  const grouped = useMemo(() => groupByCategory(expensesData || []), [expensesData]);
  const totalSpent = useMemo(() => (expensesData || []).reduce((sum: number, e: any) => sum + e.amount, 0), [expensesData]);
  const pieData = useMemo(() =>
    Array.isArray(summaryData)
      ? summaryData.map((s: any) => ({
          name: s.category === "custom" ? "Custom" : s.category.charAt(0).toUpperCase() + s.category.slice(1),
          value: s.total,
          color: CATEGORY_COLORS[s.category] || "#8884d8",
        }))
      : [],
    [summaryData]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Time Range Dropdown & Total Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Card className="flex-1 bg-blue-50 border-blue-200">
          <CardContent className="py-3 text-center">
            <span className="text-gray-700">You spent </span>
            <span className="font-bold text-lg text-blue-700">${totalSpent.toFixed(2)}</span>
            <span className="text-gray-700"> {RANGE_OPTIONS.find(r => r.value === range)?.label.toLowerCase() || ''}</span>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          {summaryLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">No data for this range.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {pieData.map((entry: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Expenses List Grouped by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
            </div>
          ) : Object.entries(grouped).length === 0 ? (
            <div className="text-center py-8 text-gray-400">No expenses yet.</div>
          ) : (
            Object.entries(grouped).map(([cat, group]) => (
              <div key={cat} className="mb-6 border rounded-lg">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-t-lg focus:outline-none"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                  type="button"
                >
                  <span className="font-semibold text-lg flex-1 text-left">
                    {group.categoryName}
                  </span>
                  <span className="font-bold text-blue-700 mr-4">${group.total.toFixed(2)}</span>
                  {openGroups[cat] ? <ChevronUp /> : <ChevronDown />}
                </button>
                <Collapse isOpened={!!openGroups[cat]}>
                  <div className="divide-y">
                    {group.expenses.map((exp, idx) => (
                      <div key={exp.id || idx} className="flex items-center justify-between px-4 py-2">
                        <div className="flex-1">
                          <div className="font-medium">{exp.description}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(exp.date), "MMM d, yyyy")} &middot; {exp.category === "custom" ? exp.customCategoryName : exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                          </div>
                        </div>
                        <div className="font-semibold text-blue-700">${exp.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </Collapse>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
} 