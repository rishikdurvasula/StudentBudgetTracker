"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsGoalForm } from "@/components/SavingsGoalForm";
import { SavingsGoalsDashboard } from "@/components/SavingsGoalsDashboard";

export default function SavingsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-2">Savings Goals</h1>
        <p className="text-gray-600">
          Set savings goals and track your progress against your budget
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Goals Dashboard</TabsTrigger>
          <TabsTrigger value="create">Create New Goal</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <SavingsGoalsDashboard />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <SavingsGoalForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 