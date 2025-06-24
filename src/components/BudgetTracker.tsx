"use client";

import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const MONTHLY_BUDGET = 500; // Hardcoded budget

const BUDGET_COLORS = {
  spent: "#EF4444",
  remaining: "#10B981",
  exceeded: "#DC2626",
};

interface BudgetData {
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
}

async function fetchBudgetData() {
  const response = await fetch("/api/expenses/summary?range=month");
  const data = await response.json();
  const totalSpent = data.reduce((sum: number, item: any) => sum + item.total, 0);
  if (totalSpent === 0) return null;
  const remaining = Math.max(0, MONTHLY_BUDGET - totalSpent);
  const percentageUsed = Math.min(100, (totalSpent / MONTHLY_BUDGET) * 100);
  const isOverBudget = totalSpent > MONTHLY_BUDGET;
  const overBudgetAmount = Math.max(0, totalSpent - MONTHLY_BUDGET);
  return {
    totalSpent,
    remaining,
    percentageUsed,
    isOverBudget,
    overBudgetAmount,
  } as BudgetData;
}

export function BudgetTracker() {
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ["budget", "month"],
    queryFn: fetchBudgetData,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Budget Tracker
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

  if (!budgetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Budget Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 text-lg">No data currently</p>
            <p className="text-gray-600 text-sm mt-2">
              Start adding expenses to see your budget tracking data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart
  const pieData = [
    {
      name: budgetData.isOverBudget ? "Over Budget" : "Spent",
      value: budgetData.isOverBudget ? budgetData.overBudgetAmount : budgetData.totalSpent,
      color: budgetData.isOverBudget ? BUDGET_COLORS.exceeded : BUDGET_COLORS.spent,
    },
    {
      name: "Remaining",
      value: budgetData.remaining,
      color: BUDGET_COLORS.remaining,
    },
  ].filter(item => item.value > 0); // Only show segments with values

  return (
    <div className="space-y-6">
      {/* Budget Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Budget Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-800">Budget Progress</span>
              <span className="text-sm text-gray-800">
                ${budgetData.totalSpent.toFixed(2)} / ${MONTHLY_BUDGET.toFixed(2)}
              </span>
            </div>
            <Progress 
              value={budgetData.percentageUsed} 
              className="h-3"
              style={{
                '--progress-background': budgetData.isOverBudget ? BUDGET_COLORS.exceeded : BUDGET_COLORS.spent
              } as React.CSSProperties}
            />
            <div className="flex justify-between text-xs text-gray-700">
              <span>{budgetData.percentageUsed.toFixed(1)}% used</span>
              <span>{budgetData.isOverBudget ? `${budgetData.overBudgetAmount.toFixed(1)}% over` : `${(100 - budgetData.percentageUsed).toFixed(1)}% remaining`}</span>
            </div>
          </div>

          {/* Budget Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">${MONTHLY_BUDGET.toFixed(2)}</div>
              <div className="text-sm text-gray-700">Monthly Budget</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${budgetData.isOverBudget ? 'text-red-700' : 'text-gray-900'}`}>${budgetData.totalSpent.toFixed(2)}</div>
              <div className="text-sm text-gray-700">Total Spent</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${budgetData.isOverBudget ? 'text-red-700' : 'text-green-700'}`}>{budgetData.isOverBudget ? '-' : '+'}${budgetData.isOverBudget ? budgetData.overBudgetAmount.toFixed(2) : budgetData.remaining.toFixed(2)}</div>
              <div className="text-sm text-gray-700">{budgetData.isOverBudget ? 'Over Budget' : 'Remaining'}</div>
            </div>
          </div>

          {/* Warning/Info Message */}
          {budgetData.isOverBudget ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-700" />
              <span className="text-red-800 font-semibold">
                You've exceeded your monthly budget by ${budgetData.overBudgetAmount.toFixed(2)}
              </span>
            </div>
          ) : budgetData.percentageUsed > 80 ? (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-700" />
              <span className="text-yellow-800 font-semibold">
                You're approaching your budget limit. ${budgetData.remaining.toFixed(2)} remaining.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <TrendingDown className="h-5 w-5 text-green-700" />
              <span className="text-green-800 font-semibold">
                Great job! You have ${budgetData.remaining.toFixed(2)} remaining in your budget.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 