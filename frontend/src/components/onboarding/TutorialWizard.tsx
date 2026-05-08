"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SUBJECT_CATEGORIES } from "@/lib/subjects";
import { X, ChevronRight, ChevronLeft, Check, BookOpen, Star } from "lucide-react";
import Link from "next/link";

interface TutorialWizardProps {
  userId: string;
  firstName: string;
  onClose: () => void;
}

export function TutorialWizard({ userId, firstName, onClose }: TutorialWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [highlightedSubjects, setHighlightedSubjects] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.keys(SUBJECT_CATEGORIES));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalSteps = 4;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleHighlight = (subject: string) => {
    setHighlightedSubjects((prev) => {
      if (prev.includes(subject)) {
        return prev.filter((s) => s !== subject);
      }
      if (prev.length >= 3) return prev;
      return [...prev, subject];
    });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save tutoring subjects
      await fetch("/api/users/tutoring-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tutoringSubjects: selectedSubjects }),
      });

      // Save highlighted subjects
      if (highlightedSubjects.length > 0) {
        await fetch("/api/users/highlighted-subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, highlightedSubjects }),
        });
      }

      setSaved(true);
    } catch (error) {
      console.error("Error saving wizard data:", error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedSubjects.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 2) {
      // Moving from highlight step to done step triggers save
      handleComplete();
    }
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (!canProceed()) return;
    setDirection(1);
    handleNext();
  };

  const goBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-blue-900"
                    : i < step
                    ? "w-2 bg-blue-400"
                    : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Skip Tutorial
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 0 && <WelcomeStep firstName={firstName} />}
              {step === 1 && (
                <SubjectsStep
                  selectedSubjects={selectedSubjects}
                  expandedCategories={expandedCategories}
                  onToggleCategory={toggleCategory}
                  onToggleSubject={toggleSubject}
                />
              )}
              {step === 2 && (
                <HighlightStep
                  selectedSubjects={selectedSubjects}
                  highlightedSubjects={highlightedSubjects}
                  onToggleHighlight={toggleHighlight}
                />
              )}
              {step === 3 && (
                <DoneStep saving={saving} saved={saved} onClose={onClose} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button
              onClick={goBack}
              disabled={step === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={`flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                canProceed()
                  ? "bg-blue-900 text-white hover:bg-blue-800"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {step === 2 ? "Finish" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function WelcomeStep({ firstName }: { firstName: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-8 h-8 text-blue-900" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Welcome, {firstName}!
      </h2>
      <h3 className="text-lg font-semibold text-blue-900 mb-4">
        Set up your tutor profile
      </h3>
      <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
        Let&apos;s get your tutor profile ready. You&apos;ll select the subjects you can
        help with, then highlight your top 3 strengths so other students can
        easily find you.
      </p>
      <p className="text-sm text-gray-400 mt-6">
        This only takes about a minute.
      </p>
    </div>
  );
}

function SubjectsStep({
  selectedSubjects,
  expandedCategories,
  onToggleCategory,
  onToggleSubject,
}: {
  selectedSubjects: string[];
  expandedCategories: string[];
  onToggleCategory: (cat: string) => void;
  onToggleSubject: (sub: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Select your subjects
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Choose all the subjects you&apos;re comfortable tutoring. ({selectedSubjects.length} selected)
      </p>
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {Object.entries(SUBJECT_CATEGORIES).map(([category, subjects]) => {
          const isExpanded = expandedCategories.includes(category);
          const selectedInCategory = subjects.filter((s) =>
            selectedSubjects.includes(s)
          ).length;

          return (
            <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => onToggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">{category}</span>
                <span className="text-sm text-gray-500">
                  {selectedInCategory > 0 && (
                    <span className="text-blue-600 font-medium mr-2">
                      {selectedInCategory} selected
                    </span>
                  )}
                  {isExpanded ? "−" : "+"}
                </span>
              </button>
              {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3">
                  {subjects.map((subject) => (
                    <label
                      key={subject}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedSubjects.includes(subject)
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject)}
                        onChange={() => onToggleSubject(subject)}
                        className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HighlightStep({
  selectedSubjects,
  highlightedSubjects,
  onToggleHighlight,
}: {
  selectedSubjects: string[];
  highlightedSubjects: string[];
  onToggleHighlight: (sub: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Highlight your top 3
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        These will be featured on the tutor status page so students can quickly
        see your strengths. ({highlightedSubjects.length}/3 selected)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-2">
        {selectedSubjects.map((subject) => {
          const isHighlighted = highlightedSubjects.includes(subject);
          const isDisabled = !isHighlighted && highlightedSubjects.length >= 3;

          return (
            <button
              key={subject}
              onClick={() => !isDisabled && onToggleHighlight(subject)}
              disabled={isDisabled}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                isHighlighted
                  ? "border-yellow-400 bg-yellow-50"
                  : isDisabled
                  ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-gray-200 hover:border-blue-200 hover:bg-blue-50 cursor-pointer"
              }`}
            >
              <Star
                className={`w-5 h-5 flex-shrink-0 ${
                  isHighlighted ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                }`}
              />
              <span className="text-sm font-medium text-gray-900">{subject}</span>
            </button>
          );
        })}
      </div>
      {selectedSubjects.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          Go back and select subjects first.
        </p>
      )}
    </div>
  );
}

function DoneStep({
  saving,
  saved,
  onClose,
}: {
  saving: boolean;
  saved: boolean;
  onClose: () => void;
}) {
  return (
    <div className="text-center py-8">
      {saving ? (
        <>
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Saving your profile...</h2>
        </>
      ) : saved ? (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re all set!</h2>
          <p className="text-gray-600 mb-8">
            Your tutor profile is ready. Students can now find you for help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/tutor/profile"
              className="px-5 py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
              onClick={onClose}
            >
              View Profile
            </Link>
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t save your selections. You can set up your subjects
            anytime from your profile page.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
          >
            Close
          </button>
        </>
      )}
    </div>
  );
}
