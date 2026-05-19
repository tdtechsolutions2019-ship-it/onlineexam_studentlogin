"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";
import { useSelector } from "react-redux";

function FinishPage() {
  const navigate = useRouter();
  const { quelen, anslen } = useSelector((state) => state.exam);
  const totalQuestions = Number(quelen) || 0;
  const attemptedQuestions = Number(anslen) || 0;
  const pendingQuestions = Math.max(totalQuestions - attemptedQuestions, 0);
  const attemptPercent =
    totalQuestions > 0
      ? Math.round((attemptedQuestions / totalQuestions) * 100)
      : 0;

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl">
      <div className="surface overflow-hidden">
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
          <p className="mb-2 inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Exam Completed
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Your Scorecard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review your attempt summary below. Your responses have been
            submitted successfully.
          </p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          <div className="rounded-xl border border-border bg-secondary/25 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Questions
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {totalQuestions}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-emerald-500/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Attempted
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {attemptedQuestions}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-amber-500/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Pending
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-700">
              {pendingQuestions}
            </p>
          </div>
        </div>

        <div className="px-6 pb-2 md:px-8">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Attempt Ratio
              </p>
              <p className="text-sm font-semibold text-primary">
                {attemptPercent}%
              </p>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary">
              <div
                className="h-2.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${attemptPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-6 pt-5 md:px-8">
          <p className="text-sm text-muted-foreground">
            You can now exit this page safely.
          </p>
          <Button
            onClick={() => navigate.push("/")}
            className="primary-action min-w-[160px] px-6 py-5 cursor-pointer"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FinishPage;
