"use client";

import { BudgetTracker } from "@/components/BudgetTracker";

export default function BudgetPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-2">Monthly Budget</h1>
        <p className="text-gray-600">
          Track your monthly spending against your budget and analyze your expenses
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <BudgetTracker />
      </div>
    </div>
  );
} 