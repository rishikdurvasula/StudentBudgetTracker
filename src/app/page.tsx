'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="text-white">
      <h1 className="text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
        Welcome to Budget Tracker
      </h1>
      
      {session ? (
        <div className="space-y-8">
          <p className="text-xl text-center text-blue-200">
            Welcome back, {session.user?.name}!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              href="/budget"
              className="group p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <h2 className="text-2xl font-semibold mb-3 text-blue-400 group-hover:text-blue-300">Track Your Budget</h2>
              <p className="text-gray-300">Monitor your monthly spending and stay within budget</p>
            </Link>
            
            <Link 
              href="/expenses"
              className="group p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <h2 className="text-2xl font-semibold mb-3 text-blue-400 group-hover:text-blue-300">Manage Expenses</h2>
              <p className="text-gray-300">Add and categorize your expenses for better insights</p>
            </Link>
            
            <Link 
              href="/savings"
              className="group p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <h2 className="text-2xl font-semibold mb-3 text-blue-400 group-hover:text-blue-300">Savings Goals</h2>
              <p className="text-gray-300">Set and track your financial goals and progress</p>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8 text-center">
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Take control of your finances with our comprehensive budget tracking and expense management platform.
          </p>
          <div className="flex gap-6 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border-2 border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors duration-300 font-medium"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
