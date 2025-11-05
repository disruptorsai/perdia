
import React, { useState, useEffect, useRef, useCallback } from "react";
import { User } from "@/api/entities";
import { Client } from "@/api/entities";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Square, Clock, Timer, AlertTriangle } from "lucide-react";
import { useClient } from "@/components/contexts/ClientContext";
import TimerDisplay from "../timer/TimerDisplay";
import ProjectSelector from "../timer/ProjectSelector";
import ActiveTimer from "../timer/ActiveTimer";
import RecentEntries from "../timer/RecentEntries";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function TimerTab() {
  const { selectedClientId, refreshActiveTimers, activeTimers } = useClient();
  const [user, setUser] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [description, setDescription] = useState("");
  const [recentEntries, setRecentEntries] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const loadingRef = useRef(false);
  const cacheRef = useRef({});

  const [showMultiClientDialog, setShowMultiClientDialog] = useState(false);
  const [existingTimers, setExistingTimers] = useState([]);
  const [pendingTimerData, setPendingTimerData] = useState(null);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const loadRecentEntries = useCallback(async () => {
    if (!selectedClientId) {
      setRecentEntries([]);
      setLoadingRecent(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingRecent(true);

    try {
      // Cache key for this client
      const cacheKey = `recent_${selectedClientId}`;
      const cachedData = cacheRef.current[cacheKey];
      const now = Date.now();

      // Use cache if less than 60 seconds old (extended from 30)
      if (cachedData && (now - cachedData.timestamp) < 60000) {
        setRecentEntries(cachedData.data);
        setLoadingRecent(false);
        loadingRef.current = false;
        return;
      }

      // Load entries with a smaller limit (15, reduced from 20) to reduce API calls
      const entries = await TimeEntry.filter({ is_running: false }, "-start_time", 15);

      // Pre-load all needed related data in batches to minimize API calls
      const taskIds = [...new Set(entries.filter(e => e.task_id).map(e => e.task_id))];
      const tasks = taskIds.length > 0 ? await Task.list('-created_date', 100) : []; // Added sorting and limit
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      const projectIds = [...new Set(tasks.map(t => t.project_id))];
      const projects = projectIds.length > 0 ? await Project.list('-created_date', 100) : []; // Added sorting and limit
      const projectMap = new Map(projects.map(p => [p.id, p]));

      // Only load clients once since we need all of them
      let clientsData = [];
      // Extended client cache time to 120 seconds (from 60)
      if (!cacheRef.current.clients || (now - cacheRef.current.clients.timestamp) > 120000) {
        clientsData = await Client.list('name', 50); // Added sorting and limit
        cacheRef.current.clients = { data: clientsData, timestamp: now };
      } else {
        clientsData = cacheRef.current.clients.data;
      }
      const clientMap = new Map(clientsData.map(c => [c.id, c]));

      // Enrich entries efficiently using maps
      const enriched = entries.map(entry => {
        let task, project, client;
        
        if (entry.task_id) {
          task = taskMap.get(entry.task_id);
          if (task) {
            project = projectMap.get(task.project_id);
            if (project) {
              client = clientMap.get(project.client_id);
            }
          }
        } else if (entry.client_id) {
          client = clientMap.get(entry.client_id);
        }
        
        return { ...entry, task, project, client };
      });

      const clientFilteredEntries = enriched
        .filter(e => e.client?.id === selectedClientId)
        .slice(0, 8); // Further limit display to 8 (from 10)
      
      // Cache the results
      cacheRef.current[cacheKey] = {
        data: clientFilteredEntries,
        timestamp: now
      };

      setRecentEntries(clientFilteredEntries);
    } catch (error) {
      console.error("Error loading recent entries:", error);
    } finally {
      setLoadingRecent(false);
      loadingRef.current = false;
    }
  }, [selectedClientId]); // Dependency for useCallback

  // Debounced version of loadRecentEntries to prevent excessive calls
  const debouncedLoadRecentEntries = useCallback((clientId) => {
    const timeoutId = setTimeout(() => {
      // Only call loadRecentEntries if a clientId is actually provided
      // and only if the current selectedClientId matches the clientId that triggered this debounce.
      // This prevents issues if selectedClientId changes rapidly.
      if (clientId) {
        loadRecentEntries();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [loadRecentEntries]); // loadRecentEntries itself is a useCallback, so it's stable.

  useEffect(() => {
    const cleanup = debouncedLoadRecentEntries(selectedClientId);
    return cleanup;
  }, [selectedClientId, debouncedLoadRecentEntries]);

  useEffect(() => {
    // This effect derives the active entry for the *currently selected client* from the global activeTimers list.
    const findAndSetCurrentTimer = async () => {
      if (!selectedClientId) {
        setActiveEntry(null); // No client selected, no active timer to display in this context
        return;
      }
      
      // We need to enrich the raw timer entries with project/client data to find the one for the selected client.
      // These lists are fetched here to ensure the most up-to-date data for enrichment.
      const projects = await Project.list();
      const tasks = await Task.list();
      const clientsData = await Client.list(); // Renamed to clientsData to avoid conflict with `clients` from useClient
      const projectMap = new Map(projects.map(p => [p.id, p]));
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      const clientMap = new Map(clientsData.map(c => [c.id, c]));

      let currentClientTimer = null;

      for (const timer of activeTimers) {
        let timerClientId = null;
        let enrichedTimer = { ...timer }; // Start with a copy to enrich
        
        if (timer.client_id) { // Non-project entry
          timerClientId = timer.client_id;
          enrichedTimer.client = clientMap.get(timerClientId);
        } else if (timer.task_id) { // Project-based entry
          const task = taskMap.get(timer.task_id);
          if (task) {
            enrichedTimer.task = task;
            const project = projectMap.get(task.project_id);
            if (project) {
              enrichedTimer.project = project;
              timerClientId = project.client_id;
              enrichedTimer.client = clientMap.get(timerClientId);
            }
          }
        }
        
        // If the timer's client ID matches the selected client ID
        if (timerClientId === selectedClientId) {
          currentClientTimer = enrichedTimer;
          break; // Stop after finding the first one for this client
        }
      }
      
      setActiveEntry(currentClientTimer);
    };

    findAndSetCurrentTimer();

  }, [activeTimers, selectedClientId]);

  useEffect(() => {
    let interval;
    if (activeEntry && activeEntry.is_running) {
      interval = setInterval(() => {
        const startTime = new Date(activeEntry.start_time);
        const now = new Date();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0); // Reset timer when there's no active entry or it's stopped
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const executeStartTimer = async () => {
    try {
      const entryData = {
        start_time: new Date().toISOString(),
        description: description,
        is_running: true,
        billable: true
      };

      if (selectedTask.is_non_project) {
        entryData.entry_type = selectedTask.entry_type;
        entryData.title = selectedTask.name;
        entryData.client_id = selectedClientId; 
      } else {
        entryData.task_id = selectedTask.id;
        entryData.entry_type = "project_task";
      }

      await TimeEntry.create(entryData);
      
      // Don't set activeEntry directly here, let the useEffect handle it from refreshActiveTimers
      setElapsedSeconds(0);
      refreshActiveTimers(); // Refresh global active timers
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const startTimer = async () => {
    if (!selectedTask) {
      console.warn("No task selected.");
      return;
    }

    if (selectedTask.is_non_project && !selectedClientId) {
       console.warn("Non-project entry requires a client selection.");
       return; 
    }

    // Check if user already has active timers
    const userActiveTimers = activeTimers.filter(timer => 
      timer.created_by === user?.email
    );

    if (userActiveTimers.length > 0) {
      // Enrich existing timers to show client names
      try {
        const [projects, tasks, clients] = await Promise.all([
          Project.list(),
          Task.list(),
          Client.list()
        ]);

        const projectMap = new Map(projects.map(p => [p.id, p]));
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        const clientMap = new Map(clients.map(c => [c.id, c]));

        const enrichedExistingTimers = userActiveTimers.map(timer => {
          let client = null;
          let displayName = timer.title || "Unknown";

          if (timer.task_id) {
            const task = taskMap.get(timer.task_id);
            if (task) {
              displayName = task.name;
              const project = projectMap.get(task.project_id);
              if (project) {
                client = clientMap.get(project.client_id);
              }
            }
          } else if (timer.client_id) {
            client = clientMap.get(timer.client_id);
            displayName = timer.title || "Non-project task";
          }

          return { ...timer, client, displayName };
        });

        setExistingTimers(enrichedExistingTimers);
        setPendingTimerData({ selectedTask, description, selectedClientId }); // Store current timer data for later use
        setShowMultiClientDialog(true);
      } catch (error) {
        console.error("Error enriching existing timers:", error);
        // If enrichment fails, just proceed with starting the timer
        await executeStartTimer();
      }
    } else {
      // No existing timers, proceed normally
      await executeStartTimer();
    }
  };

  const handleConfirmMultiClient = async () => {
    setShowMultiClientDialog(false);
    // Use the stored pendingTimerData if needed, but executeStartTimer uses current state anyway
    await executeStartTimer();
    setExistingTimers([]);
    setPendingTimerData(null);
  };

  const handleCancelMultiClient = () => {
    setShowMultiClientDialog(false);
    setExistingTimers([]);
    setPendingTimerData(null);
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      const endTime = new Date();
      const startTime = new Date(activeEntry.start_time);
      const durationMinutes = Math.ceil((endTime - startTime) / (1000 * 60));

      await TimeEntry.update(activeEntry.id, {
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        is_running: false
      });

      // Don't set activeEntry to null directly, let the useEffect handle it via refreshActiveTimers
      setElapsedSeconds(0);
      setDescription("");
      refreshActiveTimers(); // Refresh global active timers
      
      // Clear cache to force refresh of recent entries for the current client
      cacheRef.current = {}; 
      loadRecentEntries();
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isStartButtonDisabled = !selectedTask || (selectedTask.is_non_project && !selectedClientId);

  return (
    <>
      <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Time Tracking</h1>
          <p className="text-slate-600 font-medium">Track your time with precision and elegance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="space-y-6 w-full min-w-0">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 text-lg">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Timer Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TimerDisplay seconds={elapsedSeconds} isRunning={activeEntry?.is_running} />
                
                {!activeEntry ? (
                  <ProjectSelector 
                    onTaskSelect={setSelectedTask}
                    selectedTask={selectedTask}
                    description={description}
                    onDescriptionChange={setDescription}
                  />
                ) : (
                  // Display currently active entry's description when active
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-slate-700">Currently Tracking:</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {activeEntry.description || activeEntry.title || "No description"}
                    </p>
                    {activeEntry.client && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: activeEntry.client.color }}
                        />
                        <span>{activeEntry.client.name}</span>
                        {activeEntry.project && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span>{activeEntry.project.name}</span>
                          </>
                        )}
                        {activeEntry.task && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span>{activeEntry.task.name}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  {!activeEntry ? (
                    <Button
                      onClick={startTimer}
                      disabled={isStartButtonDisabled}
                      className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base min-w-0"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                      <span className="truncate">Start Timer</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={stopTimer}
                      className="flex-1 h-12 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base min-w-0"
                    >
                      <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                      <span className="truncate">Stop Timer</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {activeEntry && (
              <ActiveTimer 
                activeEntry={activeEntry}
                elapsedSeconds={elapsedSeconds}
              />
            )}
          </div>

          <div className="w-full min-w-0">
            <RecentEntries 
              entries={recentEntries}
              onRefresh={loadRecentEntries}
              loading={loadingRecent}
            />
          </div>
        </div>
      </div>

      {showMultiClientDialog && (
        <Dialog open={showMultiClientDialog} onOpenChange={setShowMultiClientDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Multiple Timers Active
              </DialogTitle>
              <DialogDescription className="space-y-3">
                <p>You currently have {existingTimers.length} active timer{existingTimers.length > 1 ? 's' : ''}:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {existingTimers.map((timer) => (
                    <div key={timer.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                      {timer.client && (
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: timer.client.color }}
                        />
                      )}
                      <span className="font-medium">{timer.client?.name || "Unknown Client"}</span>
                      <span className="text-slate-500">•</span>
                      <span className="truncate">{timer.displayName}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm">Are you sure you want to start another timer?</p>
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancelMultiClient}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmMultiClient}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Start New Timer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Utility function for debouncing
// Note: This utility is no longer used by the debouncedLoadRecentEntries
// as the debouncing logic has been moved directly into its useCallback.
// Keeping it here in case it's used elsewhere or for future reference.
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
