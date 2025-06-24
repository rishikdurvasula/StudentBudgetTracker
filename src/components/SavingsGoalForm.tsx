"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isAfter } from "date-fns";
import { CalendarIcon, Target, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const savingsGoalSchema = z.object({
  goalName: z.string().min(1, "Goal name is required"),
  targetAmount: z.number({ required_error: "Target amount is required" }).min(0.01, "Target amount must be greater than 0"),
  targetDate: z.date({ required_error: "Please select a target date" }).refine(
    (date) => isAfter(date, new Date()),
    { message: "Target date must be in the future" }
  ),
  category: z.string().optional(),
});

type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

const categories = [
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

export function SavingsGoalForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SavingsGoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const onSubmit = async (data: SavingsGoalFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSuccess(true);
        reset();
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        throw new Error("Failed to create savings goal");
      }
    } catch (error) {
      console.error("Error creating savings goal:", error);
      alert("Failed to create savings goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Create Savings Goal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="goalName">Goal Name</Label>
            <Input
              id="goalName"
              placeholder="e.g., Save for Spring Break"
              {...register("goalName")}
              className={`text-gray-900 placeholder:text-gray-500 ${errors.goalName ? "border-red-500" : ""}`}
            />
            {errors.goalName && (
              <p className="text-sm text-red-500">{errors.goalName.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Select onValueChange={(value) => setValue("category", value)}>
              <SelectTrigger className={`text-gray-900 ${errors.category ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Amount ($)</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("targetAmount", { valueAsNumber: true })}
              className={`text-gray-900 placeholder:text-gray-500 ${errors.targetAmount ? "border-red-500" : ""}`}
            />
            {errors.targetAmount && (
              <p className="text-sm text-red-500">{errors.targetAmount.message}</p>
            )}
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label>Target Date</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("targetDate") ? format(watch("targetDate"), "PPP") : "Pick a date"}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-auto p-0">
                <DialogHeader>
                  <DialogTitle>Select Target Date</DialogTitle>
                </DialogHeader>
                <Calendar
                  mode="single"
                  selected={watch("targetDate")}
                  onSelect={(date) => date && setValue("targetDate", date)}
                  initialFocus
                  disabled={(date) => !isAfter(date, new Date())}
                />
              </DialogContent>
            </Dialog>
            {errors.targetDate && (
              <p className="text-sm text-red-500">{errors.targetDate.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Goal"}
          </Button>

          {/* Success Message */}
          {isSuccess && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Savings goal created successfully!
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 