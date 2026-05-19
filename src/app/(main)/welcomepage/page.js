"use client";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import React from "react";
function Welecomepage() {
  const navigate = useRouter();
  const [activeTab, setActiveTab] = React.useState("1");
  const [initialValues] = React.useState({
    languagetype: "",
  });

  const englishInstructions = [
    "Question type for Online Exam is MCQ.",
    "Gujarati questions are available in CCC, CMOA, Tally and DMOA.",
    "After login, verify your Name and Course details.",
    "Select an answer only after you are sure.",
    "If you face any issue while reading questions, contact your examiner.",
    "Check whether all questions are attempted before finishing.",
    "Pending questions cannot be answered after you click Finish Exam.",
    "Click Finish Exam only when you are sure no question is left.",
  ];

  const gujaratiInstructions = [
    "ઓનલાઇન પરીક્ષાનો પ્રશ્ન પ્રકાર MCQ છે.",
    "ગુજરાતી પ્રશ્નો CCC, CMOA, Tally અને DMOA માં ઉપલબ્ધ છે.",
    "લોગિન પછી તમારું નામ અને કોર્સ વિગતો ચકાસો.",
    "જ્યારે ખાતરી હોય ત્યારે જ જવાબ પસંદ કરો.",
    "પ્રશ્ન વાંચવામાં અથવા સમજવામાં સમસ્યા હોય તો પરિક્ષકનો સંપર્ક કરો.",
    "Finish કરતા પહેલાં બધા પ્રશ્નો attempt થયા છે તેની ખાતરી કરો.",
    "Finish Exam પછી બાકી રહેલા પ્રશ્નનો જવાબ આપી શકાશે નહીં.",
    "બધું પૂરું થયા પછી જ Finish Exam બટન દબાવો.",
  ];

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
  });

  return (
    <div className="mx-auto mt-6 w-full max-w-6xl">
      <div className="surface p-6 md:p-8">
        <div className="mb-6 border-b border-border pb-5">
          <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Student Dashboard
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Welcome to C-DAC Online Exam Portal
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Please review all instructions carefully before starting your exam.
            Once you click finish, unanswered questions cannot be attempted.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/20 p-4">
          {/* Tabs Header */}
          <div className="flex gap-2 mb-4 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab("1")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeTab === "1"
                  ? "bg-primary text-white"
                  : "bg-transparent text-foreground"
              }`}
            >
              English
            </button>

            <button
              onClick={() => setActiveTab("2")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeTab === "2"
                  ? "bg-primary text-white"
                  : "bg-transparent text-foreground"
              }`}
            >
              ગુજરાતી
            </button>
          </div>

          {/* Tab Content */}
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            {(activeTab === "1"
              ? englishInstructions
              : gujaratiInstructions
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">
            Choose Language
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Select your preferred language for the exam interface.
          </p>

          <div className="mt-4 w-1/2">
            <Select
              value={formik.values.languagetype}
              onValueChange={(val) => formik.setFieldValue("languagetype", val)}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1" className="cursor-pointer">
                  English
                </SelectItem>
                <SelectItem value="2" className="cursor-pointer">
                  Gujarati
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Make sure your device is stable and connected before starting.
            </p>
            <Button
              onClick={() =>
                navigate.push(`/exampage?lan=${formik.values.languagetype}`)
              }
              className="primary-action cursor-pointer px-8"
              disabled={!formik.values.languagetype}
            >
              Start Exam
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welecomepage;
