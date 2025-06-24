"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isAfter } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const expenseSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  date: z.date({ required_error: "Please select a date" }).refine(
    (date) => !isAfter(date, new Date()),
    { message: "Date cannot be in the future" }
  ),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["academic", "groceries", "transport", "leisure", "rent", "other"]),
  customCategoryName: z.string().optional(),
}).refine(
  (data) => {
    if (data.category === "other") {
      return !!data.customCategoryName && data.customCategoryName.trim().length > 0;
    }
    return true;
  },
  {
    message: "Custom category name is required when category is other",
    path: ["customCategoryName"],
  }
);

type ExpenseFormData = z.infer<typeof expenseSchema>;

const categories = [
  { value: "academic", label: "Academic" },
  { value: "groceries", label: "Groceries" },
  { value: "transport", label: "Transport" },
  { value: "leisure", label: "Leisure" },
  { value: "rent", label: "Rent" },
  { value: "other", label: "Other" },
];

export function ExpenseForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const selectedCategory = watch("category");

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/expenses", {
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
        throw new Error("Failed to submit expense");
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      alert("Failed to submit expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
              className={`text-gray-900 placeholder:text-gray-500 ${errors.amount ? "border-red-500" : ""}`}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("date") ? format(watch("date"), "PPP") : "Pick a date"}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-auto p-0">
                <DialogHeader>
                  <DialogTitle>Select Date</DialogTitle>
                </DialogHeader>
                <Calendar
                  mode="single"
                  selected={watch("date")}
                  onSelect={(date) => date && setValue("date", date)}
                  initialFocus
                />
              </DialogContent>
            </Dialog>
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter expense description..."
              {...register("description")}
              className={`text-gray-900 placeholder:text-gray-500 ${errors.description ? "border-red-500" : ""}`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => setValue("category", value as any)}>
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

          {/* Conditional Custom Category Input */}
          {selectedCategory === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customCategoryName">Custom Category</Label>
              <Input
                id="customCategoryName"
                placeholder="Enter custom category..."
                {...register("customCategoryName")}
                className={`text-gray-900 placeholder:text-gray-500 ${errors.customCategoryName ? "border-red-500" : ""}`}
              />
              {errors.customCategoryName && (
                <p className="text-sm text-red-500">{errors.customCategoryName.message}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Expense"}
          </Button>

          {/* Success Message */}
          {isSuccess && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Expense submitted successfully!
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 