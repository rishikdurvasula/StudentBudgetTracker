"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BarChart3, Bell } from "lucide-react";
import { ExpenseForm } from "@/components/ExpenseForm";
import ExpenseDashboard from "@/components/ExpenseDashboard";

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "add">("dashboard");

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-2">
            Expense Tracker
          </h1>
          <p className="text-gray-400">
            Track your spending and analyze your expenses by category
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "add" ? "default" : "ghost"}
            onClick={() => setActiveTab("add")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "dashboard" ? (
            <ExpenseDashboard />
          ) : activeTab === "add" ? (
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <ExpenseForm />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 