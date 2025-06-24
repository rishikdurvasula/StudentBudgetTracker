"use client";

import { useState, useMemo } from "react";
import { format, differenceInDays, isAfter } from "date-fns";
import { Target, Calendar, DollarSign, TrendingUp, AlertCircle, Edit, Check, X, Filter } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SavingsGoal {
  id: string;
  goalName: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  category?: string;
  isCompleted: boolean;
  createdAt: string;
}

interface BudgetData {
  monthlyBudget: number;
  totalSpent: number;
  totalSaved: number;
}

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "food", label: "Food & Dining" },
  { value: "groceries", label: "Groceries" },
  { value: "transport", label: "Transportation" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "travel", label: "Travel" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health & Fitness" },
  { value: "home", label: "Home & Utilities" },
  { value: "other", label: "Other" },
];

export function SavingsGoalsDashboard() {
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch savings goals
  const { data: goals = [], isLoading: goalsLoading, refetch: refetchGoals } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const res = await fetch("/api/savings-goals");
      return await res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
    staleTime: 5 * 60 * 1000,
  });

  // Filter goals by category
  const filteredGoals = useMemo(() => {
    if (categoryFilter === "all") return goals;
    return goals.filter(goal => goal.category === categoryFilter);
  }, [goals, categoryFilter]);

  // Fetch budget data
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ["budget-summary"],
    queryFn: async () => {
      const monthlyBudget = 500;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const response = await fetch(`/api/expenses/summary?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`);
      if (response.ok) {
        const data = await response.json();
        const totalSpent = data.totalSpent || 0;
        const totalSaved = Math.max(0, monthlyBudget - totalSpent);
        return {
          monthlyBudget,
          totalSpent,
          totalSaved,
        };
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const calculateProgress = (goal: SavingsGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string) => {
    const days = differenceInDays(new Date(targetDate), new Date());
    return Math.max(0, days);
  };

  const getStatusColor = (goal: SavingsGoal) => {
    if (goal.isCompleted) return "bg-green-100 text-green-800";
    if (isAfter(new Date(), new Date(goal.targetDate))) return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStatusText = (goal: SavingsGoal) => {
    if (goal.isCompleted) return "Completed";
    if (isAfter(new Date(), new Date(goal.targetDate))) return "Overdue";
    return "Active";
  };

  const getCategoryDisplayName = (category?: string) => {
    if (!category) return null;
    const categoryMap: Record<string, string> = {
      food: "Food & Dining",
      groceries: "Groceries",
      transport: "Transportation",
      entertainment: "Entertainment",
      shopping: "Shopping",
      travel: "Travel",
      education: "Education",
      health: "Health & Fitness",
      home: "Home & Utilities",
      other: "Other",
    };
    return categoryMap[category] || category;
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-800";
    const colorMap: Record<string, string> = {
      food: "bg-orange-100 text-orange-800",
      groceries: "bg-green-100 text-green-800",
      transport: "bg-blue-100 text-blue-800",
      entertainment: "bg-purple-100 text-purple-800",
      shopping: "bg-pink-100 text-pink-800",
      travel: "bg-yellow-100 text-yellow-800",
      education: "bg-indigo-100 text-indigo-800",
      health: "bg-red-100 text-red-800",
      home: "bg-teal-100 text-teal-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colorMap[category] || "bg-gray-100 text-gray-800";
  };

  const handleEditClick = (goal: SavingsGoal) => {
    setEditingGoal(goal.id);
    setEditAmount(goal.currentAmount.toString());
  };

  const handleSaveEdit = async (goalId: string) => {
    try {
      const newAmount = parseFloat(editAmount);
      if (isNaN(newAmount) || newAmount < 0) {
        alert("Please enter a valid amount");
        return;
      }
      const response = await fetch(`/api/savings-goals/${goalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentAmount: newAmount }),
      });
      if (response.ok) {
        refetchGoals();
        setEditingGoal(null);
        setEditAmount("");
      } else {
        throw new Error("Failed to update goal");
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      alert("Failed to update goal. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setEditAmount("");
  };

  if (goalsLoading || budgetLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      {budgetData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Monthly Budget</p>
                <p className="text-2xl font-bold text-green-600">${budgetData.monthlyBudget}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">${budgetData.totalSpent.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Saved</p>
                <p className="text-2xl font-bold text-blue-600">${budgetData.totalSaved.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Budget Usage</span>
                <span>{((budgetData.totalSpent / budgetData.monthlyBudget) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(budgetData.totalSpent / budgetData.monthlyBudget) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Savings Goals
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {categoryFilter === "all" 
                  ? "No savings goals yet. Create your first goal to start tracking!"
                  : `No savings goals in the "${categoryOptions.find(opt => opt.value === categoryFilter)?.label}" category.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGoals.map((goal) => {
                const progress = calculateProgress(goal);
                const daysRemaining = getDaysRemaining(goal.targetDate);
                const statusColor = getStatusColor(goal);
                const statusText = getStatusText(goal);
                const categoryDisplayName = getCategoryDisplayName(goal.category);
                const categoryColor = getCategoryColor(goal.category);

                return (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.goalName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due {format(new Date(goal.targetDate), "MMM dd, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={statusColor}>
                        {statusText}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount Remaining</p>
                        <p className="font-semibold">${(goal.targetAmount - goal.currentAmount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Days Remaining</p>
                        <p className="font-semibold">{daysRemaining} days</p>
                      </div>
                    </div>

                    {/* Budget Comparison */}
                    {budgetData && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Budget Comparison</span>
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-600">
                            You've saved <span className="font-semibold text-blue-600">${budgetData.totalSaved.toFixed(2)}</span> this month.
                            {budgetData.totalSaved > 0 && (
                              <span> This could contribute to your savings goal!</span>
                            )}
                          </p>
                          {budgetData.totalSpent > budgetData.monthlyBudget && (
                            <div className="flex items-center gap-1 mt-1 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span>You're over budget this month. Consider adjusting your spending.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Category Badge */}
                    {categoryDisplayName && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Category</span>
                        </div>
                        <div className="text-sm">
                          <Badge className={categoryColor}>
                            {categoryDisplayName}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 