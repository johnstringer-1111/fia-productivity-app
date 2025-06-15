import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Target, Users, CheckCircle, MessageCircle, Star, Clock, TrendingUp, BookOpen, Phone, DollarSign, LogOut, User, Mic, MicOff, Plus, Filter, BarChart3, Bell, Settings, Trash2, Play, Pause, Square, Timer } from 'lucide-react';
import { 
  signUp, 
  signIn, 
  signOut, 
  onAuthChange, 
  getCurrentUser,
  getUserProfile, 
  updateUserProfile,
  createUserProfile,
  saveChatMessage, 
  loadChatHistory,
  saveGoal,
  loadGoals,
  saveTask,
  loadTasks,
  updateTaskStatus,
  deleteTask,
  saveMultipleGoals,
  saveMultipleTasks,
  startTaskTimer,
  pauseTaskTimer,
  resumeTaskTimer,
  stopTaskTimer,
  getTaskTimerData
} from './utils/supabase';

const FocusedInspiredActionApp = () => {
  // Core State
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({});
  
  // Data State
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('pending');
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSimpleologySettings, setShowSimpleologySettings] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '' });
  
  // Simpleology Integration State
  const [simpleologyApiKey, setSimpleologyApiKey] = useState('');
  const [simpleologyConnected, setSimpleologyConnected] = useState(false);
  const [syncingSimpleology, setSyncingSimpleology] = useState(false);
  
  // Voice Recording
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  
  // Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_duration: 30,
    goal_id: null
  });

// Timer State
  const [activeTimers, setActiveTimers] = useState({});
  const timerIntervals = useRef({});
const tasksRef = useRef(tasks);

  // Onboarding questions
  const onboardingQuestions = [
    {
      id: 'workStyle',
      question: 'What best describes your preferred work style?',
      type: 'multiple',
      options: [
        'Deep focus blocks with minimal interruptions',
        'Short bursts with frequent breaks',
        'Flexible schedule based on energy levels',
        'Structured time blocks with clear boundaries'
      ]
    },
    {
      id: 'priorities',
      question: 'What are your top 3 life priorities right now?',
      type: 'text',
      placeholder: 'e.g., Career advancement, Health & fitness, Family time...'
    },
    {
      id: 'challenges',
      question: 'What are your biggest productivity challenges?',
      type: 'multiple',
      options: [
        'Procrastination and getting started',
        'Time management and scheduling',
        'Staying focused and avoiding distractions',
        'Overwhelm and too many tasks',
        'Lack of clear goals and direction'
      ],
      multiple: true
    },
    {
      id: 'goals',
      question: 'What are 2-3 major goals you want to achieve in the next 90 days?',
      type: 'text',
      placeholder: 'Be specific and measurable...'
    },
    {
      id: 'schedule',
      question: 'When do you typically do your best work?',
      type: 'multiple',
      options: [
        'Early morning (5-9 AM)',
        'Mid-morning (9 AM-12 PM)',
        'Afternoon (12-5 PM)',
        'Evening (5-9 PM)',
        'Late night (9 PM+)'
      ]
    },
    {
      id: 'accountability',
      question: 'How do you prefer to be held accountable?',
      type: 'multiple',
      options: [
        'Daily check-ins and reminders',
        'Weekly progress reviews',
        'Milestone celebrations',
        'Gentle nudges when off-track'
      ],
      multiple: true
    }
  ];

// Timer Functions
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

const updateTimerDisplay = (taskId) => {
const task = tasksRef.current.find(t => t.id === taskId);
  if (!task) return;

  let currentTime = task.timer_total_time || 0;
  
  if (task.timer_is_running && task.timer_start_time) {
    const startTime = typeof task.timer_start_time === 'string' 
      ? new Date(task.timer_start_time).getTime() 
      : task.timer_start_time;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    currentTime += elapsed;
  }

  setActiveTimers(prev => ({
    ...prev,
    [taskId]: currentTime
  }));
};

const handleStartTimer = async (taskId) => {
  try {
    const result = await startTaskTimer(taskId, user.id);
    
    if (result.success) {
      // Update task in state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              timer_is_running: true,
              timer_start_time: new Date().toISOString(),
              timer_total_time: task.timer_total_time || 0,
              timer_pause_count: task.timer_pause_count || 0
            }
          : task
      ));

      // Simple interval that counts from 0
      if (timerIntervals.current[taskId]) {
        clearInterval(timerIntervals.current[taskId]);
      }
      
      const startTime = Date.now();
      const initialTime = 0; // Always start from 0 for new timer
      
      timerIntervals.current[taskId] = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setActiveTimers(prev => ({
          ...prev,
          [taskId]: initialTime + elapsed
        }));
      }, 1000);
    }
  } catch (error) {
    alert('Error starting timer');
  }
};

  const handlePauseTimer = async (taskId) => {
  try {
    // Get current timer value before pausing
    const currentTimerValue = activeTimers[taskId] || 0;
    
    const result = await pauseTaskTimer(taskId, user.id);
    
    if (result.success) {
      // Clear interval
      if (timerIntervals.current[taskId]) {
        clearInterval(timerIntervals.current[taskId]);
        delete timerIntervals.current[taskId];
      }

      // Update task in state with the current timer value
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              timer_is_running: false,
              timer_total_time: currentTimerValue, // Use the actual displayed time
              timer_pause_count: (task.timer_pause_count || 0) + 1,
              timer_last_paused: new Date().toISOString()
            }
          : task
      ));

      // Keep the display showing the current time
      setActiveTimers(prev => ({
        ...prev,
        [taskId]: currentTimerValue
      }));
    } else {
      alert('Failed to pause timer: ' + result.error);
    }
  } catch (error) {
    alert('Error pausing timer');
  }
};

  const handleResumeTimer = async (taskId) => {
  try {
    const result = await resumeTaskTimer(taskId, user.id);
    
    if (result.success) {
      // Get the current displayed time (what was saved during pause)
      const previousTime = activeTimers[taskId] || 0;
      
      // Update task in state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              timer_is_running: true,
              timer_start_time: new Date().toISOString()
            }
          : task
      ));

      // Start interval from previous time
      if (timerIntervals.current[taskId]) {
        clearInterval(timerIntervals.current[taskId]);
      }
      
      const startTime = Date.now();
      
      timerIntervals.current[taskId] = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setActiveTimers(prev => ({
          ...prev,
          [taskId]: previousTime + elapsed
        }));
      }, 1000);
    }
  } catch (error) {
    alert('Error resuming timer');
  }
};

  const handleStopTimer = async (taskId) => {
  try {
    // Get current timer value before stopping
    const finalTime = activeTimers[taskId] || 0;
    
    const result = await stopTaskTimer(taskId, user.id);
    
    if (result.success) {
      // Clear interval
      if (timerIntervals.current[taskId]) {
        clearInterval(timerIntervals.current[taskId]);
        delete timerIntervals.current[taskId];
      }

      // Update task in state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              timer_is_running: false,
              timer_start_time: null,
              timer_total_time: finalTime // Use the displayed time
            }
          : task
      ));

      // Update display
      setActiveTimers(prev => ({
        ...prev,
        [taskId]: finalTime
      }));

      // Show completion message with time comparison
      const task = tasks.find(t => t.id === taskId);
      if (task && task.estimated_duration) {
        const actualMinutes = Math.round(finalTime / 60);
        const estimatedMinutes = task.estimated_duration;
        const difference = actualMinutes - estimatedMinutes;
        
        let message = `Task timer stopped. Total time: ${formatTime(finalTime)}`;
        if (difference > 0) {
          message += `\n\nTook ${difference} minutes longer than estimated (${estimatedMinutes} min)`;
        } else if (difference < 0) {
          message += `\n\nCompleted ${Math.abs(difference)} minutes faster than estimated (${estimatedMinutes} min)`;
        } else {
          message += `\n\nCompleted exactly on time! (${estimatedMinutes} min)`;
        }
        
        alert(message);
      }
    } else {
      alert('Failed to stop timer: ' + result.error);
    }
  } catch (error) {
    alert('Error stopping timer');
  }
};

  /// Initialize timers for tasks that are running
useEffect(() => {
  tasks.forEach(task => {
    // Skip if no timer data
    if (!task.timer_total_time && !task.timer_is_running) return;
    
    // Set initial display value
    let displayTime = task.timer_total_time || 0;
    
    // If timer is running, start counting from current total
    if (task.timer_is_running) {
      // Clear any existing interval
      if (timerIntervals.current[task.id]) {
        clearInterval(timerIntervals.current[task.id]);
      }
      
      // Start counting from the stored total time
      let counter = displayTime;
      setActiveTimers(prev => ({ ...prev, [task.id]: counter }));
      
      timerIntervals.current[task.id] = setInterval(() => {
        counter += 1;
        setActiveTimers(prev => ({ ...prev, [task.id]: counter }));
      }, 1000);
    } else {
      // Just display the stored time for paused/stopped timers
      setActiveTimers(prev => ({ ...prev, [task.id]: displayTime }));
    }
  });

  // Cleanup
  return () => {
    Object.keys(timerIntervals.current).forEach(taskId => {
      if (!tasks.find(t => t.id === taskId)) {
        clearInterval(timerIntervals.current[taskId]);
        delete timerIntervals.current[taskId];
      }
    });
  };
}, [tasks]);

// Add the new useEffect HERE:
useEffect(() => {
  tasksRef.current = tasks;
}, [tasks]);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(timerIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

// BULLETPROOF AUTH FLOW - Handles cached sessions and conflicts
useEffect(() => {
  let mounted = true;
  let authSubscription = null;
  let timeoutId = null;

  const initializeAuth = async () => {
    try {
      // Immediate timeout protection
      timeoutId = setTimeout(() => {
        if (mounted) {
          setLoading(false);
          setCurrentView('home');
        }
      }, 6000); // 6 second max

      // Set up auth listener first
      const { data: listener } = onAuthChange(async (event, session) => {
        if (!mounted) return;
        
        // Clear timeout when auth state changes
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        setAuthError('');
        
        try {
          if (session?.user) {
            setUser(session.user);
            
            if (event === 'SIGNED_UP') {
              await handleNewUserSetup(session.user);
            } else {
              await loadUserData(session.user.id);
            }
          } else {
            resetUserState();
          }
        } catch (error) {
          setAuthError('Unable to load your account. Please try refreshing the page.');
          setLoading(false);
          setCurrentView('home');
        }
      });

      authSubscription = listener;

      // Check for existing session - with race condition protection
      try {
        const sessionCheck = await Promise.race([
          getCurrentUser(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 3000)
          )
        ]);

        if (sessionCheck?.data?.user && mounted) {
          setUser(sessionCheck.data.user);
          await loadUserData(sessionCheck.data.user.id);
        } else if (mounted) {
          setCurrentView('home');
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setCurrentView('home');
          setLoading(false);
        }
      }

    } catch (error) {
      if (mounted) {
        setCurrentView('home');
        setLoading(false);
        setAuthError('Unable to connect. Please check your internet connection.');
      }
    }
  };

  initializeAuth();

  return () => {
    mounted = false;
    if (timeoutId) clearTimeout(timeoutId);
    if (authSubscription?.subscription?.unsubscribe) {
      authSubscription.subscription.unsubscribe();
    }
  };
}, []); // Empty dependency array is correct here

// Enhanced reset user state with cache clearing
const resetUserState = () => {
  setUser(null);
  setUserProfile(null);
  setGoals([]);
  setTasks([]);
  setChatMessages([]);
  setAnalytics(null);
  setCurrentView('home');
  setLoading(false);
  setAuthError('');
  
  // Clear any cached auth state
  if (typeof window !== 'undefined') {
    try {
      // Clear common Supabase localStorage keys
      const keysToRemove = [
        'supabase.auth.token',
        'sb-eukbotdgyqtcwrfwtwso-auth-token',
        'supabase.auth.user',
        'supabase.auth.session'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });
    } catch (e) {
      // Ignore localStorage errors in incognito/private mode
    }
  }
};

// Handle new user setup
const handleNewUserSetup = async (user) => {
  try {
    setLoading(true);
    await createUserProfile(user);
    setCurrentView('onboarding');
  } catch (error) {
    setAuthError('Setup failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

// ULTRA-ROBUST USER DATA LOADING - Prevents hanging
const loadUserData = async (userId) => {
  if (!userId) {
    setCurrentView('home');
    setLoading(false);
    return;
  }

  setLoading(true);

  // Maximum 8 seconds for entire data loading process
  const loadingTimeout = setTimeout(() => {
    setLoading(false);
    setCurrentView('dashboard');
    setAnalytics({
      tasks_completed_today: 0,
      tasks_pending: 0,
      productivity_score: 8.2,
      weekly_focus_time: 1240,
      completion_rate: 0
    });
  }, 8000);

  try {
    // Load user profile with aggressive timeout
    const profileResult = await Promise.race([
      getUserProfile(userId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile timeout')), 3000)
      )
    ]);
    
    if (!profileResult.success) {
      await createUserProfile({ id: userId, email: user?.email || '' });
      clearTimeout(loadingTimeout);
      setCurrentView('onboarding');
      setLoading(false);
      return;
    }

    if (!profileResult.data) {
      clearTimeout(loadingTimeout);
      setCurrentView('onboarding');
      setLoading(false);
      return;
    }

    setUserProfile(profileResult.data);
    setOnboardingData(profileResult.data.onboarding_data || {});

    // Load Simpleology connection status
    if (profileResult.data.simpleology_api_key && profileResult.data.simpleology_connected) {
      setSimpleologyApiKey(profileResult.data.simpleology_api_key);
      setSimpleologyConnected(true);
    }

    // Check if onboarding is complete
    if (!profileResult.data.onboarding_completed) {
      clearTimeout(loadingTimeout);
      setCurrentView('onboarding');
      setLoading(false);
      return;
    }

    // Load other data with shorter, individual timeouts
    const loadWithTimeout = (promise, timeout = 2000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    };

    const [goalsResult, tasksResult, chatResult] = await Promise.allSettled([
      loadWithTimeout(loadGoals(userId)),
      loadWithTimeout(loadTasks(userId)),
      loadWithTimeout(loadChatHistory(userId))
    ]);

    // Process results - always succeeds even if some fail
    const processedGoals = [];
    const processedTasks = [];
    const processedChat = [];

    if (goalsResult.status === 'fulfilled' && goalsResult.value.success) {
      processedGoals.push(...(goalsResult.value.data || []).map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        priority: goal.priority,
        progress: goal.progress || 0,
        deadline: goal.target_date ? new Date(goal.target_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: goal.status || 'active'
      })));
    }

    if (tasksResult.status === 'fulfilled' && tasksResult.value.success) {
      processedTasks.push(...(tasksResult.value.data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        due_date: task.due_date ? new Date(task.due_date) : null,
        estimated_duration: task.estimated_duration || 30,
        voice_input: task.voice_input || false,
        completed_at: task.completed_at ? new Date(task.completed_at) : null,
        simpleology_id: task.simpleology_id || null,
        imported_from_simpleology: task.imported_from_simpleology || false,
// Timer fields
timer_start_time: task.timer_start_time || null,
timer_total_time: task.timer_total_time || 0,
timer_pause_count: task.timer_pause_count || 0,
timer_is_running: task.timer_is_running || false,
timer_last_paused: task.timer_last_paused || null
      })));
    }

    if (chatResult.status === 'fulfilled' && chatResult.value.success) {
      processedChat.push(...(chatResult.value.messages || []));
    }

    // Set all data
    setGoals(processedGoals);
    setTasks(processedTasks);
    setChatMessages(processedChat);

    // Calculate analytics
    const completedToday = processedTasks.filter(t => 
      t.status === 'completed' && 
      t.completed_at && 
      t.completed_at.toDateString() === new Date().toDateString()
    ).length;

    setAnalytics({
      tasks_completed_today: completedToday,
      tasks_pending: processedTasks.filter(t => t.status === 'pending').length,
      productivity_score: 8.2,
      weekly_focus_time: 1240,
      completion_rate: processedTasks.length > 0 ? (completedToday / processedTasks.length) * 100 : 0
    });

    clearTimeout(loadingTimeout);
    setCurrentView('dashboard');

  } catch (error) {
    // Always show dashboard even with errors
    setAnalytics({
      tasks_completed_today: 0,
      tasks_pending: 0,
      productivity_score: 8.2,
      weekly_focus_time: 1240,
      completion_rate: 0
    });
    
    clearTimeout(loadingTimeout);
    setCurrentView('dashboard');
    
    if (error.message !== 'Timeout') {
      setAuthError('Some features may be limited due to connection issues.');
    }
  } finally {
    setLoading(false);
  }
};

  // Authentication Functions
  const handleAuth = async () => {
    if (!authData.email || !authData.password) {
      setAuthError('Please fill in all fields');
      return;
    }

    if (authMode === 'signup' && authData.password !== authData.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');
      
      let result;
      if (authMode === 'signup') {
        result = await signUp(authData.email, authData.password);
      } else {
        result = await signIn(authData.email, authData.password);
      }

      if (!result.success) {
        setAuthError(result.error);
        setLoading(false);
      }
      // Success handling will be done by auth listener
    } catch (error) {
      setAuthError('Unable to connect. Please check your internet connection and try again.');
      setLoading(false);
    }
  };

  // Enhanced handle sign out with cache clearing
  const handleSignOut = async () => {
    try {
      setLoading(true);
      
      // Clear all local state first
      resetUserState();
      
      // Sign out from Supabase
      await signOut();
      
      // Force clear any cached auth state
      if (typeof window !== 'undefined') {
        // Clear localStorage if it exists (fail silently)
        try {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('sb-eukbotdgyqtcwrfwtwso-auth-token');
        } catch (e) {
          // Ignore localStorage errors
        }
        
        // Clear sessionStorage if it exists (fail silently)  
        try {
          sessionStorage.clear();
        } catch (e) {
          // Ignore sessionStorage errors
        }
      }
      
    } catch (error) {
      // Even if signout fails, reset the app state
      resetUserState();
    } finally {
      setLoading(false);
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      alert('Unable to access microphone. Please check your browser permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob) => {
    try {
      setLoading(true);
      
      // Simulate voice processing - replace with actual voice API in production
      const voiceTask = {
        title: "Voice-created task",
        description: "This task was created from voice input",
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        estimated_duration: 30,
        voice_input: true
      };
      
      const result = await saveTask(user.id, voiceTask);
      if (result.success) {
        const savedTask = {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description,
          priority: result.data.priority,
          status: result.data.status,
          due_date: result.data.due_date ? new Date(result.data.due_date) : null,
          estimated_duration: result.data.estimated_duration,
          voice_input: result.data.voice_input,
          completed_at: null,
timer_start_time: null,
timer_total_time: 0,
timer_pause_count: 0,
timer_is_running: false,
timer_last_paused: null
        };
        
        setTasks(prev => [savedTask, ...prev]);
      }
    } catch (error) {
      alert('Unable to process voice input. Please try typing your task instead.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioChunks.length > 0 && !isRecording) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      processVoiceInput(audioBlob);
      setAudioChunks([]);
    }
  }, [audioChunks, isRecording]);

  // UPDATED SIMPLEOLOGY INTEGRATION FUNCTIONS - Import only, no sync-back
  const connectSimpleology = async (apiKey) => {
    if (!apiKey.trim()) {
      alert('Please enter your Simpleology API key');
      return;
    }

    try {
      setSyncingSimpleology(true);
      
      // Test API connection with actual Simpleology endpoint
      const response = await fetch('https://my.simpleology.com/api/v1/daily-targets?page=1', {
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Check if there's an error in the response
      if (responseData.error) {
        throw new Error(responseData.error.message || 'Invalid API key');
      }

      // If we get here, the API key is valid
      setSimpleologyApiKey(apiKey);
      setSimpleologyConnected(true);
      
      // Save API key to user profile
      await updateUserProfile(user.id, {
        simpleology_api_key: apiKey,
        simpleology_connected: true
      });

      alert('✅ Simpleology connected successfully!\n\nNote: You can import daily targets to F.I.A., but changes in F.I.A. won\'t sync back to Simpleology (API limitation).');
      setShowSimpleologySettings(false);
      
    } catch (error) {
      console.error('Simpleology connection error:', error);
      alert(`❌ Failed to connect to Simpleology: ${error.message}`);
    } finally {
      setSyncingSimpleology(false);
    }
  };

  const importSimpleologyTargets = async () => {
    if (!simpleologyConnected || !simpleologyApiKey) {
      alert('Please connect to Simpleology first');
      return;
    }

    try {
      setSyncingSimpleology(true);
      
      // Fetch daily targets from Simpleology
      const response = await fetch('https://my.simpleology.com/api/v1/daily-targets', {
        headers: {
          'Authorization': `Basic ${btoa(simpleologyApiKey + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily targets');
      }

      const responseData = await response.json();
      
      // Check if there's an error in the response
      if (responseData.error) {
        throw new Error(responseData.error.message || 'API Error');
      }

      // Transform Simpleology targets to F.I.A. tasks
      const targets = responseData.data || [];
      
      if (targets.length === 0) {
        alert('No daily targets found in Simpleology for today.');
        return;
      }

      // Filter out targets that are already imported (avoid duplicates)
      const existingSimpleologyIds = tasks
        .filter(t => t.simpleology_id)
        .map(t => t.simpleology_id);
      
      const newTargets = targets.filter(target => !existingSimpleologyIds.includes(target.id));
      
      if (newTargets.length === 0) {
        alert('All Simpleology targets have already been imported.');
        return;
      }
      
      const importedTasks = newTargets.map(target => ({
        title: target.item || 'Imported Task',
        description: `Imported from Simpleology${target.comment ? ': ' + target.comment : ''}`,
        priority: 'medium',
        status: target.achieved === 'y' ? 'completed' : 'pending',
        estimated_duration: 30,
        voice_input: false,
        simpleology_id: target.id, // Store Simpleology ID for reference
        imported_from_simpleology: true
      }));

      // Save imported tasks to database
      const results = await Promise.all(
        importedTasks.map(task => saveTask(user.id, task))
      );

      const successfulImports = results.filter(r => r.success);
      
      // Add to local state
      const newTasks = successfulImports.map(result => ({
        id: result.data.id,
        title: result.data.title,
        description: result.data.description,
        priority: result.data.priority,
        status: result.data.status,
        due_date: result.data.due_date ? new Date(result.data.due_date) : null,
        estimated_duration: result.data.estimated_duration,
        voice_input: result.data.voice_input,
        simpleology_id: result.data.simpleology_id,
        imported_from_simpleology: true,
        completed_at: result.data.status === 'completed' ? new Date() : null,
timer_start_time: null,
timer_total_time: 0,
timer_pause_count: 0,
timer_is_running: false,
timer_last_paused: null
      }));

      setTasks(prev => [...newTasks, ...prev]);
      
      alert(`✅ Imported ${successfulImports.length} new tasks from Simpleology!\n\nNote: Changes to these tasks in F.I.A. won't sync back to Simpleology due to API limitations.`);
      
    } catch (error) {
      console.error('Simpleology import error:', error);
      alert(`❌ Failed to import Simpleology targets: ${error.message}`);
    } finally {
      setSyncingSimpleology(false);
    }
  };

  const disconnectSimpleology = async () => {
    try {
      setSimpleologyConnected(false);
      setSimpleologyApiKey('');
      
      // Remove from user profile
      await updateUserProfile(user.id, {
        simpleology_api_key: null,
        simpleology_connected: false
      });

      alert('Simpleology disconnected');
    } catch (error) {
      alert('Failed to disconnect Simpleology');
    }
  };

  // Task Management Functions
  const createTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      setLoading(true);
      
      const result = await saveTask(user.id, newTask);
      if (result.success) {
        const savedTask = {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description,
          priority: result.data.priority,
          status: result.data.status,
          due_date: result.data.due_date ? new Date(result.data.due_date) : null,
          estimated_duration: result.data.estimated_duration,
          voice_input: result.data.voice_input || false,
          completed_at: null,
timer_start_time: null,
timer_total_time: 0,
timer_pause_count: 0,
timer_is_running: false,
timer_last_paused: null
        };
        
        setTasks(prev => [savedTask, ...prev]);
        
        // Reset form
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
          estimated_duration: 30,
          goal_id: null
        });
        setShowTaskForm(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert('Unable to save task. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Removed sync-back to Simpleology since API doesn't support updates
  const toggleTaskCompletion = async (taskId, currentlyCompleted) => {
    if (!user) return;

    try {
      const newStatus = currentlyCompleted ? 'pending' : 'completed';
      const completedAt = currentlyCompleted ? null : new Date();
      
      const result = await updateTaskStatus(taskId, newStatus, completedAt);
      if (result.success) {
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: newStatus,
                completed_at: completedAt
              } 
            : task
        ));
        
        // REMOVED: Sync with Simpleology (API doesn't support updates)
        // await syncTaskToSimpleology(taskId, !currentlyCompleted);
        
        // Update analytics
        const updatedTasks = tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, completed_at: completedAt }
            : task
        );
        
        const completedToday = updatedTasks.filter(t => 
          t.status === 'completed' && 
          t.completed_at && 
          t.completed_at.toDateString() === new Date().toDateString()
        ).length;
        
        setAnalytics(prev => ({
          ...prev,
          tasks_completed_today: completedToday,
          tasks_pending: updatedTasks.filter(t => t.status === 'pending').length
        }));
      }
    } catch (error) {
      alert('Unable to update task. Please check your connection and try again.');
    }
  };

  const removeTask = async (taskId) => {
    if (!user) return;

    try {
      const result = await deleteTask(taskId);
      if (result.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (error) {
      alert('Unable to delete task. Please check your connection and try again.');
    }
  };

  // AI Chat Function
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const userMessage = { role: 'user', content: newMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    setLoading(true);

    // Save user message
    await saveChatMessage(user.id, 'user', messageToSend, {
      goals: goals.map(g => g.title),
      tasks: tasks.slice(0, 3).map(t => t.title)
    });

    try {
      // Simple fallback AI response for production
      const responses = [
        "Great question! Let's focus on your most important task right now. What's the one thing that would make the biggest impact today? 🎯",
        "I'm here to help you stay productive! Break down that big goal into smaller, actionable steps. What's the first step you can take? 💪",
        "Remember, progress over perfection! What's one small win you can achieve in the next 25 minutes? 🏆",
        "Time to take action! Which task on your list aligns best with your top priority goals? Let's tackle it! 🚀",
        "You've got this! Sometimes the best productivity tip is to just start. What feels manageable right now? ✨"
      ];

      const aiResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage = { 
        role: 'assistant', 
        content: aiResponse, 
        timestamp: new Date() 
      };
      setChatMessages(prev => [...prev, aiMessage]);
      
      await saveChatMessage(user.id, 'assistant', aiResponse);
    } catch (error) {
      const fallbackMessage = {
        role: 'assistant',
        content: "I'm here to help you stay productive! What's your most important task right now? 💪",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, fallbackMessage]);
      await saveChatMessage(user.id, 'assistant', fallbackMessage.content);
    } finally {
      setLoading(false);
    }
  };

  // Onboarding Functions
  const handleOnboardingAnswer = async (answer) => {
    const currentQuestion = onboardingQuestions[onboardingStep];
    const updatedData = {
      ...onboardingData,
      [currentQuestion.id]: answer
    };
    setOnboardingData(updatedData);
    
    if (onboardingStep < onboardingQuestions.length - 1) {
      setOnboardingStep(prev => prev + 1);
    } else {
      await completeOnboarding(updatedData);
    }
  };

  const completeOnboarding = async (data) => {
    try {
      setLoading(true);
      
      // Save onboarding completion
      await updateUserProfile(user.id, {
        onboarding_completed: true,
        onboarding_data: data
      });

      // Generate initial goals and tasks
      await generateInitialCoachingPlan(data);
      
      // Reload user data
      await loadUserData(user.id);
    } catch (error) {
      alert('Unable to complete setup. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const generateInitialCoachingPlan = async (data) => {
    try {
      const initialGoals = [
        {
          title: "Morning Routine Optimization",
          description: `Tailored for your ${data.schedule || 'preferred work time'}`,
          priority: 'high',
          progress: 0,
          status: 'active',
          target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          title: "Focused Work Implementation", 
          description: `${data.workStyle || 'Your preferred work style'} approach`,
          priority: 'high',
          progress: 0,
          status: 'active',
          target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      ];

      const initialTasks = [
        {
          title: "Design your ideal morning routine",
          description: "Create a structured start to your day",
          status: 'pending',
          priority: 'high',
          estimated_duration: 45,
          voice_input: false,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
          title: "Block calendar for deep work",
          description: "Schedule uninterrupted focus time",
          status: 'pending',
          priority: 'medium',
          estimated_duration: 30,
          voice_input: false,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      ];

      await saveMultipleGoals(user.id, initialGoals);
      await saveMultipleTasks(user.id, initialTasks);
    } catch (error) {
      // Silent fail - onboarding can still complete without initial data
    }
  };

  // Subscription Functions
  const handleSubscription = async () => {
    try {
      const subscriptionData = {
        user_id: user.id,
        status: 'active',
        plan: 'fia_premium',
        price: 3.33,
        created_at: new Date()
      };

      setSubscription(subscriptionData);
      setCurrentView('dashboard');
      alert('Welcome to F.I.A. Premium! 🎉\n\nYou now have access to:\n✅ Daily F.I.A. calls\n✅ Advanced AI coaching\n✅ Priority support');
    } catch (error) {
      alert('Unable to process subscription. Please try again or contact support.');
    }
  };

  const bookCoachingCall = async () => {
    try {
      alert('1-Hour Aligned Accountability & Success Coaching call booking!\n\nPrice: $197\nYou will be redirected to schedule your session.');
      window.open('https://calendly.com/jsi-sessions/aligned-accountability-success-coaching', '_blank');
    } catch (error) {
      alert('Unable to open booking page. Please visit our website directly or contact support.');
    }
  };

  // Utility Functions
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (activeTab === 'pending') return task.status === 'pending';
      if (activeTab === 'in_progress') return task.status === 'in_progress';
      if (activeTab === 'completed') return task.status === 'completed';
      return true;
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Professional loading state with user escape route
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-white mx-auto mb-4 animate-spin" />
          <div className="text-white text-xl mb-2">Loading F.I.A.</div>
          <div className="text-white/60 text-sm mb-8">Setting up your productivity workspace...</div>
          
          {/* Show continue button after 4 seconds */}
          <div className="opacity-0" style={{ animation: 'fadeIn 0.5s ease-in 4s forwards' }}>
            <p className="text-white/40 text-sm mb-4">Taking longer than expected?</p>
            <button
              onClick={() => {
                setLoading(false);
                setCurrentView(user ? 'dashboard' : 'home');
              }}
              className="bg-white/20 text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Continue to App
            </button>
          </div>
        </div>
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Render Functions
  const renderAuth = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Target className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {authMode === 'signin' ? 'Welcome Back' : 'Join F.I.A.'}
          </h2>
          <p className="text-gray-600">
            {authMode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{authError}</p>
            {authError.includes('connection') && (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Refresh page to try again
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={authData.email}
            onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
          />
          <input
            type="password"
            placeholder="Password"
            value={authData.password}
            onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
          />
          {authMode === 'signup' && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={authData.confirmPassword}
              onChange={(e) => setAuthData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
            />
          )}
          
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-indigo-400"
          >
            {loading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
          
          <button
            onClick={() => {
              setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
              setAuthError('');
            }}
            className="w-full text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
          
          <button
            onClick={() => setCurrentView('home')}
            className="w-full text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  const renderOnboarding = () => {
    const currentQuestion = onboardingQuestions[onboardingStep];
    
    if (!currentQuestion) {
      setCurrentView('dashboard');
      return null;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <Target className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to F.I.A!</h2>
            <p className="text-gray-600">Let's personalize your productivity coaching experience</p>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                {onboardingQuestions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded-full ${
                      index <= onboardingStep ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Step {onboardingStep + 1} of {onboardingQuestions.length}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h3>

            {currentQuestion.type === 'multiple' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOnboardingAnswer(currentQuestion.multiple ? 
                      [...(onboardingData[currentQuestion.id] || []), option] : option)}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    {option}
                  </button>
                ))}
                {currentQuestion.multiple && (
                  <button
                    onClick={() => setOnboardingStep(prev => prev + 1)}
                    className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Continue
                  </button>
                )}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div>
                <textarea
                  placeholder={currentQuestion.placeholder}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-300 focus:outline-none h-32 resize-none"
                  onChange={(e) => setOnboardingData(prev => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value
                  }))}
                />
                <button
                  onClick={() => handleOnboardingAnswer(onboardingData[currentQuestion.id])}
                  disabled={!onboardingData[currentQuestion.id]?.trim()}
                  className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              placeholder="Additional details (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300 h-20 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="30"
                  value={newTask.estimated_duration}
                  onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
                  className="w-full p-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
                  min="1"
                  max="480"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">minutes</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">How long will this take?</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={newTask.due_date}
              onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={createTask}
              disabled={!newTask.title.trim() || loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 font-medium"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button
              onClick={() => setShowTaskForm(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // UPDATED: Simpleology Settings UI with clear messaging about import-only functionality
  const renderSimpleologySettings = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-green-600" />
          Simpleology Integration
        </h3>
        
        {!simpleologyConnected ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">What This Integration Does:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ✅ Import your daily targets from Simpleology to F.I.A.</li>
                <li>• ✅ Avoid duplicate imports (smart filtering)</li>
                <li>• ✅ Preserve original task status</li>
                <li>• ❌ Two-way sync not supported (Simpleology API limitation)</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Changes made to imported tasks in F.I.A. will NOT sync back to Simpleology due to API limitations. This is import-only.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Simpleology API Key
              </label>
              <input
                type="password"
                placeholder="Enter your API key from Simpleology"
                value={simpleologyApiKey}
                onChange={(e) => setSimpleologyApiKey(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your API key in Simpleology Settings → API Access
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => connectSimpleology(simpleologyApiKey)}
                disabled={syncingSimpleology || !simpleologyApiKey.trim()}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
              >
                {syncingSimpleology ? 'Connecting...' : 'Connect Simpleology'}
              </button>
              <button
                onClick={() => {
                  setShowSimpleologySettings(false);
                  setSimpleologyApiKey('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Connected to Simpleology</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your daily targets can be imported to F.I.A.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-medium text-amber-800 mb-1">Integration Status:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• ✅ Import daily targets → F.I.A.</li>
                <li>• ❌ F.I.A. changes → Simpleology (API doesn't support updates)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={importSimpleologyTargets}
                disabled={syncingSimpleology}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
              >
                {syncingSimpleology ? 'Importing...' : 'Import Today\'s Targets'}
              </button>
              
              <button
                onClick={disconnectSimpleology}
                className="w-full border border-red-300 text-red-700 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Disconnect Simpleology
              </button>
              
              <button
                onClick={() => setShowSimpleologySettings(false)}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSubscriptionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <Star className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock Full F.I.A. Experience</h3>
          <p className="text-gray-600 mb-6">Get the complete productivity coaching system</p>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl mb-6">
            <div className="text-4xl font-bold text-indigo-600 mb-2">$3.33<span className="text-lg text-gray-500">/month</span></div>
            <p className="text-sm text-gray-600">Billed monthly, cancel anytime</p>
          </div>

          <div className="text-left space-y-3 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-gray-700">Complete F.I.A. productivity app</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-gray-700">Daily weekday F.I.A. calls (2 PM ET)</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-gray-700">AI productivity coach chat</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-gray-700">Voice-to-task conversion</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-gray-700">Progress analytics & insights</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSubscription}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Start Your F.I.A. Journey
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <Target className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Focused Inspired Action
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            Your AI-powered productivity coach that transforms dreams into daily actions with voice-powered task creation and expert coaching
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-white text-indigo-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('auth')}
                className="bg-white text-indigo-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Start Your Journey
              </button>
            )}
            <button
              onClick={() => window.open('https://www.johnstringerinc.com/focused-inspired-action-calls/', '_blank')}
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-indigo-900 transition-colors"
            >
              Join Our F.I.A. Calls
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <Mic className="h-10 w-10 text-white mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Voice-to-Task</h3>
            <p className="text-white/80 text-sm">
              Speak your tasks and let AI organize them with priorities and deadlines
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <BookOpen className="h-10 w-10 text-white mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Smart Onboarding</h3>
            <p className="text-white/80 text-sm">
              Personalized coaching based on your unique work style and goals
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <MessageCircle className="h-10 w-10 text-white mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">AI Coach Chat</h3>
            <p className="text-white/80 text-sm">
              Get instant expert advice and guidance from your AI productivity coach
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <BarChart3 className="h-10 w-10 text-white mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Progress Analytics</h3>
            <p className="text-white/80 text-sm">
              Track your productivity with detailed analytics and insights
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
            <Phone className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">1-Hour Aligned Accountability & Success Coaching</h3>
            <p className="text-white/80 mb-6">
              Book a personalized coaching session to accelerate your goals and overcome any obstacles.
            </p>
            <div className="text-3xl font-bold text-white mb-4">$197</div>
            <button
              onClick={bookCoachingCall}
              className="bg-yellow-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-yellow-600 transition-colors"
            >
              Book Your Coaching Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Target className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">F.I.A. Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowSimpleologySettings(true)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                  simpleologyConnected 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Simpleology Integration"
              >
                <Target className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">
                  {simpleologyConnected ? 'Simpleology ✓' : 'Connect Simpleology'}
                </span>
                <span className="sm:hidden">
                  {simpleologyConnected ? 'S✓' : 'S'}
                </span>
              </button>
              
              <button
                onClick={() => window.open('https://www.johnstringerinc.com/focused-inspired-action-calls/', '_blank')}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm"
              >
                <Phone className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Join Our F.I.A. Calls</span>
                <span className="sm:hidden">Calls</span>
              </button>
              {!subscription && (
                <button
                  onClick={() => setCurrentView('subscription')}
                  className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center text-sm"
                >
                  <Star className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Upgrade</span>
                </button>
              )}
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600 hidden md:block">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {analytics && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.tasks_completed_today}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.tasks_pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold text-indigo-600">{analytics.productivity_score}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Focus Time</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.floor(analytics.weekly_focus_time / 60)}h</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{Math.round(analytics.completion_rate)}%</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-indigo-600" />
                Your Goals
              </h2>
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Complete your onboarding to get personalized goals!</p>
                    <button
                      onClick={() => setCurrentView('onboarding')}
                      className="mt-2 text-indigo-600 hover:text-indigo-700"
                    >
                      Start Onboarding
                    </button>
                  </div>
                ) : (
                  goals.map(goal => (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {goal.progress}% • Due: {goal.deadline.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
                  Your Tasks
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-lg transition-colors ${
                      isRecording 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                    disabled={loading}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {simpleologyConnected && (
                    <button
                      onClick={importSimpleologyTargets}
                      disabled={syncingSimpleology}
                      className="bg-green-100 text-green-600 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center text-sm"
                      title="Import today's targets from Simpleology"
                    >
                      <Target className="h-4 w-4 mr-1" />
                      {syncingSimpleology ? 'Importing...' : 'Import'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </button>
                </div>
              </div>

              {isRecording && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-700 font-medium">Recording... Speak your tasks</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Stop & Process
                  </button>
                </div>
              )}

              <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
                  { key: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
                  { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {getFilteredTasks().length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {activeTab === 'pending' && 'No pending tasks. Great job!'}
                      {activeTab === 'in_progress' && 'No tasks in progress.'}
                      {activeTab === 'completed' && 'No completed tasks yet.'}
                    </p>
                  </div>
                ) : (
                  getFilteredTasks().map(task => (
                    <div key={task.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => toggleTaskCompletion(task.id, task.status === 'completed')}
                        className="h-5 w-5 text-indigo-600 rounded"
                      />
                      <div className="flex-1">
  <div className="flex items-center space-x-2 mb-1">
    <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
      {task.title}
    </h4>
    {task.voice_input && (
      <Mic className="h-4 w-4 text-indigo-500" title="Created via voice input" />
    )}
    {task.imported_from_simpleology && (
      <Target className="h-4 w-4 text-green-500" title="Imported from Simpleology" />
    )}
  </div>
  {task.description && (
    <p className="text-sm text-gray-600 mb-1">{task.description}</p>
  )}
  <div className="flex items-center space-x-3 text-xs text-gray-500">
    {task.due_date && (
      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
    )}
    {task.estimated_duration && (
      <span>Est: {task.estimated_duration} min</span>
    )}
    {(task.timer_total_time > 0 || task.timer_is_running) && (
      <span className="flex items-center">
        <Timer className="h-3 w-3 mr-1" />
        {formatTime(activeTimers[task.id] || task.timer_total_time || 0)}
        {task.timer_pause_count > 0 && (
          <span className="ml-1 text-gray-400">
            ({task.timer_pause_count} pauses)
          </span>
        )}
      </span>
    )}
    {task.completed_at && (
      <span>Done: {new Date(task.completed_at).toLocaleDateString()}</span>
    )}
  </div>
</div>
<div className="flex items-center space-x-2">
  {/* Timer Controls */}
{task.status !== 'completed' && (
  <div className="flex items-center space-x-1">
    {!task.timer_is_running && task.timer_total_time === 0 && (
      <button
        onClick={() => handleStartTimer(task.id)}
        className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded transition-colors"
        title="Start timer"
        disabled={loading}
      >
        <Play className="h-4 w-4" />
      </button>
    )}
    {task.timer_is_running && (
      <>
        <button
          onClick={() => handlePauseTimer(task.id)}
          className="p-1.5 bg-yellow-100 text-yellow-600 hover:bg-yellow-200 rounded transition-colors"
          title="Pause timer"
          disabled={loading}
        >
          <Pause className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleStopTimer(task.id)}
          className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors"
          title="Stop timer"
          disabled={loading}
        >
          <Square className="h-4 w-4" />
        </button>
      </>
    )}
    {!task.timer_is_running && task.timer_total_time > 0 && (
      <>
        <button
          onClick={() => handleResumeTimer(task.id)}
          className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition-colors"
          title="Resume timer"
          disabled={loading}
        >
          <Play className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleStopTimer(task.id)}
          className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors"
          title="Stop timer"
          disabled={loading}
        >
          <Square className="h-4 w-4" />
        </button>
      </>
    )}
  </div>
)}
  
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
    {task.priority}
  </span>
  <button
    onClick={() => {
      if (window.confirm('Are you sure you want to delete this task?')) {
        removeTask(task.id);
      }
    }}
    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all duration-200"
    title="Delete task"
  >
    <Trash2 className="h-4 w-4" />
  </button>
</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-indigo-600" />
                AI Productivity Coach
              </h2>
              
              <div className="h-64 overflow-y-auto mb-4 space-y-3 border rounded-lg p-3 bg-gray-50">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Ask your AI coach anything about productivity!</p>
                    <div className="mt-3 space-y-1 text-xs text-gray-400">
                      <p>• "How do I stay focused?"</p>
                      <p>• "Help me prioritize my tasks"</p>
                      <p>• "I'm feeling overwhelmed"</p>
                    </div>
                  </div>
                )}
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-indigo-100 text-indigo-900 ml-auto'
                        : 'bg-white text-gray-900 border'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {loading && (
                  <div className="bg-white border rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask your coach anything..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={bookCoachingCall}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors text-sm font-medium"
                >
                  📞 Book 1-Hour Coaching Call ($197)
                </button>
                
                <button
                  onClick={() => window.open('https://www.johnstringerinc.com/focused-inspired-action-calls/', '_blank')}
                  className="w-full bg-green-100 text-green-700 p-3 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  🎯 Join Daily F.I.A. Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render logic
  if (showTaskForm) {
    return (
      <div>
        {renderDashboard()}
        {renderTaskForm()}
      </div>
    );
  }

  if (showSimpleologySettings) {
    return (
      <div>
        {renderDashboard()}
        {renderSimpleologySettings()}
      </div>
    );
  }

  if (currentView === 'subscription') {
    return (
      <div>
        {renderDashboard()}
        {renderSubscriptionModal()}
      </div>
    );
  }

  if (currentView === 'auth') {
    return renderAuth();
  }

  if (currentView === 'onboarding') {
    return renderOnboarding();
  }

  if (currentView === 'dashboard') {
    return renderDashboard();
  }

  return renderHome();
};

export default FocusedInspiredActionApp;
