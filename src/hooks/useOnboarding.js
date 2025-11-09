import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing onboarding state
 * Handles wizard progress, discovery tasks, and tour completion
 */
export function useOnboarding() {
  // Wizard state
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return localStorage.getItem('perdia_onboarding_completed') === 'true';
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('perdia_onboarding_current_step');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [onboardingSkipped, setOnboardingSkipped] = useState(() => {
    return localStorage.getItem('perdia_onboarding_skipped') === 'true';
  });

  // Discovery tasks state
  const [discoveryTasks, setDiscoveryTasks] = useState(() => {
    const saved = localStorage.getItem('perdia_discovery_tasks');
    return saved ? JSON.parse(saved) : {
      quick_start: false,
      view_performance: false,
      ai_conversation: false,
      add_keywords: false,
      generate_content: false,
      approve_publish: false,
      configure_automation: false,
      schedule_content: false,
      invite_team: false,
      take_tour: false,
    };
  });

  // Tours completed state
  const [toursCompleted, setToursCompleted] = useState(() => {
    const saved = localStorage.getItem('perdia_tours_completed');
    return saved ? JSON.parse(saved) : {
      ai_agents: false,
      keyword_manager: false,
      content_workflow: false,
      automation: false,
      performance: false,
    };
  });

  // Show/hide discovery checklist
  const [showDiscoveryChecklist, setShowDiscoveryChecklist] = useState(() => {
    const saved = localStorage.getItem('perdia_show_discovery_checklist');
    return saved === null ? true : saved === 'true';
  });

  // Persist wizard state
  useEffect(() => {
    localStorage.setItem('perdia_onboarding_completed', onboardingCompleted.toString());
  }, [onboardingCompleted]);

  useEffect(() => {
    localStorage.setItem('perdia_onboarding_current_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('perdia_onboarding_skipped', onboardingSkipped.toString());
  }, [onboardingSkipped]);

  // Persist discovery tasks
  useEffect(() => {
    localStorage.setItem('perdia_discovery_tasks', JSON.stringify(discoveryTasks));
  }, [discoveryTasks]);

  // Persist tours completed
  useEffect(() => {
    localStorage.setItem('perdia_tours_completed', JSON.stringify(toursCompleted));
  }, [toursCompleted]);

  // Persist checklist visibility
  useEffect(() => {
    localStorage.setItem('perdia_show_discovery_checklist', showDiscoveryChecklist.toString());
  }, [showDiscoveryChecklist]);

  // Wizard functions
  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    setCurrentStep(0);
    // Auto-complete the quick_start task
    setDiscoveryTasks(prev => ({ ...prev, quick_start: true }));
  }, []);

  const skipOnboarding = useCallback(() => {
    setOnboardingSkipped(true);
    setOnboardingCompleted(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingCompleted(false);
    setCurrentStep(0);
    setOnboardingSkipped(false);
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  // Discovery task functions
  const markTaskComplete = useCallback((taskKey) => {
    setDiscoveryTasks(prev => ({ ...prev, [taskKey]: true }));
  }, []);

  const markTaskIncomplete = useCallback((taskKey) => {
    setDiscoveryTasks(prev => ({ ...prev, [taskKey]: false }));
  }, []);

  const getDiscoveryProgress = useCallback(() => {
    const tasks = Object.values(discoveryTasks);
    const completed = tasks.filter(Boolean).length;
    const total = tasks.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [discoveryTasks]);

  const resetDiscoveryTasks = useCallback(() => {
    setDiscoveryTasks({
      quick_start: false,
      view_performance: false,
      ai_conversation: false,
      add_keywords: false,
      generate_content: false,
      approve_publish: false,
      configure_automation: false,
      schedule_content: false,
      invite_team: false,
      take_tour: false,
    });
  }, []);

  // Tour functions
  const markTourComplete = useCallback((tourKey) => {
    setToursCompleted(prev => ({ ...prev, [tourKey]: true }));
    // Also mark the "take_tour" discovery task as complete
    markTaskComplete('take_tour');
  }, [markTaskComplete]);

  const resetTours = useCallback(() => {
    setToursCompleted({
      ai_agents: false,
      keyword_manager: false,
      content_workflow: false,
      automation: false,
      performance: false,
    });
  }, []);

  // Complete reset
  const resetAll = useCallback(() => {
    resetOnboarding();
    resetDiscoveryTasks();
    resetTours();
    setShowDiscoveryChecklist(true);
  }, [resetOnboarding, resetDiscoveryTasks, resetTours]);

  return {
    // Wizard state
    onboardingCompleted,
    currentStep,
    onboardingSkipped,

    // Wizard functions
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    goToStep,
    nextStep,
    previousStep,

    // Discovery state
    discoveryTasks,
    showDiscoveryChecklist,

    // Discovery functions
    markTaskComplete,
    markTaskIncomplete,
    getDiscoveryProgress,
    setShowDiscoveryChecklist,
    resetDiscoveryTasks,

    // Tour state
    toursCompleted,

    // Tour functions
    markTourComplete,
    resetTours,

    // Complete reset
    resetAll,
  };
}
