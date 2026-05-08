"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TutorialWizard } from "./TutorialWizard";
import { AnimatePresence } from "framer-motion";

export function OnboardingGate() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.userId) {
      setShowWizard(false);
      setChecked(false);
      return;
    }

    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem(`wizard_dismissed_${user.userId}`);
    if (dismissed) {
      setChecked(true);
      return;
    }

    // Check if user has subjects
    const checkSubjects = async () => {
      try {
        const res = await fetch(`/api/users/tutoring-subjects?userId=${user.userId}`);
        if (res.ok) {
          const data = await res.json();
          const subjects = data.tutoringSubjects || [];
          if (subjects.length === 0) {
            setShowWizard(true);
          }
        }
      } catch (error) {
        // Silently fail -- don't block the UI
        console.error("Onboarding check failed:", error);
      } finally {
        setChecked(true);
      }
    };

    checkSubjects();
  }, [isAuthenticated, isLoading, user?.userId]);

  const handleClose = () => {
    setShowWizard(false);
    if (user?.userId) {
      sessionStorage.setItem(`wizard_dismissed_${user.userId}`, "true");
    }
  };

  if (!checked || !showWizard || !user) return null;

  return (
    <AnimatePresence>
      {showWizard && (
        <TutorialWizard
          userId={user.userId}
          firstName={user.firstName}
          onClose={handleClose}
        />
      )}
    </AnimatePresence>
  );
}
