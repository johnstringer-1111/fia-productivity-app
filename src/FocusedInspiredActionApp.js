import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Target, Users, CheckCircle, MessageCircle, Star, Clock, TrendingUp, BookOpen, Phone, DollarSign, LogOut, User, Mic, MicOff, Plus, Filter, BarChart3, Bell, Settings } from 'lucide-react';

const FocusedInspiredActionApp = () => {
  // Core State
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({});
  
  // Data State
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('pending');
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '' });
  const [chatLoading, setChatLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Voice Recording
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  
  // Chat scroll ref
  const chatEndRef = useRef(null);
  
  // Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_duration: 30,
    goal_id: null
  });

  // Onboarding questions for expert productivity coaching
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

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please check microphone permissions.');
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
      
      // For MVP: Simulate voice processing
      setTimeout(() => {
        const sampleTasks = [
          {
            id: Date.now(),
            title: "Voice-created task",
            description: "This task was created from voice input (simulated)",
            priority: 'medium',
            status: 'pending',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            estimated_duration: 30,
            voice_input: true
          }
        ];
        
        setTasks(prev => [...prev, ...sampleTasks]);
        alert('Voice input processed! Created 1 task from your speech.');
        setLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      alert('Error processing voice input. This feature will be enhanced in the next version!');
      setLoading(false);
    }
  };

  // Process audio chunks when recording stops
  useEffect(() => {
    if (audioChunks.length > 0 && !isRecording) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      processVoiceInput(audioBlob);
      setAudioChunks([]);
    }
  }, [audioChunks, isRecording]);

  // Authentication Functions
  const handleAuth = async () => {
    try {
      setLoading(true);
      
      // Basic validation
      if (!authData.email || !authData.password) {
        alert('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      if (authMode === 'signup' && authData.password !== authData.confirmPassword) {
        alert('Passwords do not match');
        setLoading(false);
        return;
      }
      
      const simulatedUser = { 
        id: 'user-' + Date.now(), 
        email: authData.email,
        full_name: authData.email.split('@')[0]
      };
      
      setUser(simulatedUser);
      
      if (authMode === 'signup') {
        setCurrentView('onboarding');
      } else {
        await loadUserData(simulatedUser.id);
        setCurrentView('dashboard');
      }
    } catch (error) {
      alert('Authentication error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setUser(null);
    setCurrentView('home');
    setGoals([]);
    setTasks([]);
    setChatMessages([]);
    setSubscription(null);
    setApiError(null);
  };

  // Data Loading Functions
  const loadUserData = async (userId) => {
    try {
      setGoals([
        {
          id: 1,
          title: "Complete Q1 Business Goals",
          description: "Focus on revenue growth and team expansion",
          priority: 'high',
          progress: 65,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active'
        }
      ]);

      setTasks([
        {
          id: 1,
          title: "Review monthly reports",
          description: "Analyze performance metrics",
          priority: 'high',
          status: 'pending',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          estimated_duration: 60,
          voice_input: false
        },
        {
          id: 2,
          title: "Team standup meeting",
          description: "Daily sync with development team",
          priority: 'medium',
          status: 'completed',
          due_date: new Date(),
          estimated_duration: 30,
          voice_input: false,
          completed_at: new Date()
        }
      ]);

      setAnalytics({
        tasks_completed_today: 3,
        tasks_pending: 8,
        productivity_score: 8.2,
        weekly_focus_time: 1240,
        completion_rate: 0.73
      });

      // Add welcome message to chat
      setChatMessages([{
        id: 1,
        role: 'assistant',
        content: "Welcome to F.I.A.! I'm your AI productivity coach. How can I help you stay focused and take inspired action today?",
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Task Management Functions
  const createTask = async () => {
    try {
      if (!newTask.title.trim()) {
        alert('Please enter a task title');
        return;
      }

      const task = {
        ...newTask,
        id: Date.now(),
        user_id: user.id,
        status: 'pending',
        voice_input: false,
        created_at: new Date()
      };

      setTasks(prev => [...prev, task]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        estimated_duration: 30,
        goal_id: null
      });
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    }
  };

  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: completed ? 'pending' : 'completed',
              completed_at: completed ? null : new Date()
            } 
          : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // AI Coaching Functions
  const getAICoachResponse = async (userData) => {
    const endpointUrl = 'https://nhpl89.buildship.run/executeWorkflow/DjpYEJJCD62ZKLZuy2V6/9a584791-6106-4ccf-b164-67986a9316cb';

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userGoals: userData.userGoals || goals.map(g => g.title).join(', '),
          recentTasks: userData.recentTasks || tasks.slice(0, 3).map(t => t.title).join(', '),
          userChallenges: userData.userChallenges || onboardingData.challenges || 'General productivity',
          workStyle: userData.workStyle || onboardingData.workStyle || 'Flexible approach',
          prompt: userData.prompt,
          sessionId: userData.sessionId || user?.id || 'default-session',
        }),
      });

      if (!response.ok) {
        throw new Error(`BuildShip API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different possible response formats
      if (data.aiCoachResponse) {
        return data.aiCoachResponse;
      } else if (data.response) {
        return data.response;
      } else if (data.message) {
        return data.message;
      } else if (typeof data === 'string') {
        return data;
      } else {
        throw new Error('Unexpected response format from AI coach');
      }
    } catch (error) {
      console.error('AI Coach API Error:', error);
      throw error;
    }
  };

  // Send Message Function - THIS WAS MISSING!
 const sendMessage = async () => {
  if (!newMessage.trim() || !user) return;
  
  try {
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);
    
    // Call real AI coaching API
    const response = await fetch('https://your-buildship-id.buildship.app/ai-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        message: newMessage,
        context: { goals, tasks, onboardingData }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const aiResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }
  } catch (error) {
    console.error('AI coaching error:', error);
  } finally {
    setLoading(false);
  }
};

  // Handle Enter key in chat input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
      await generateInitialCoachingPlan(data);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const generateInitialCoachingPlan = async (data) => {
    try {
      const initialGoals = [
        {
          id: 1,
          user_id: user.id,
          title: "Morning Routine Optimization",
          description: `Tailored for your ${data.schedule || 'preferred work time'}`,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          priority: 'high',
          progress: 0,
          status: 'active'
        },
        {
          id: 2,
          user_id: user.id,
          title: "Focused Work Implementation",
          description: `${data.workStyle || 'Your preferred work style'} approach`,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          priority: 'high',
          progress: 0,
          status: 'active'
        }
      ];

      setGoals(initialGoals);

      const initialTasks = [
        {
          id: 1,
          user_id: user.id,
          goal_id: 1,
          title: "Design your ideal morning routine",
          description: "Create a structured start to your day",
          status: 'pending',
          priority: 'high',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          estimated_duration: 45,
          voice_input: false
        },
        {
          id: 2,
          user_id: user.id,
          goal_id: 2,
          title: "Block calendar for deep work",
          description: "Schedule uninterrupted focus time",
          status: 'pending',
          priority: 'medium',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          estimated_duration: 30,
          voice_input: false
        }
      ];

      setTasks(initialTasks);

      // Add welcome message after onboarding
      setChatMessages([{
        id: 1,
        role: 'assistant',
        content: `Welcome to F.I.A., ${user.full_name}! Based on your preferences for ${data.workStyle || 'productivity'}, I've created a personalized plan for you. How are you feeling about getting started?`,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error generating coaching plan:', error);
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
      console.error('Error creating subscription:', error);
    }
  };

  const bookCoachingCall = async () => {
    try {
      alert('1-Hour Aligned Accountability & Success Coaching call booking!\n\nPrice: $197\nYou will be redirected to schedule your session.');
      window.open('https://www.johnstringerinc.com/aligned-accountability-success-coaching/', '_blank');
    } catch (error) {
      console.error('Error booking call:', error);
    }
  };

  // Filter tasks by status
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (activeTab === 'pending') return task.status === 'pending';
      if (activeTab === 'in_progress') return task.status === 'in_progress';
      if (activeTab === 'completed') return task.status === 'completed';
      return true;
    });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
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
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
          />
          
          <textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300 h-20 resize-none"
          />
          
          <div className="grid grid-cols-2 gap-4">
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
            
            <input
              type="number"
              placeholder="Duration (min)"
              value={newTask.estimated_duration}
              onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
            />
          </div>
          
          <input
            type="datetime-local"
            value={newTask.due_date}
            onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300"
          />
          
          <div className="flex space-x-3">
            <button
              onClick={createTask}
              disabled={!newTask.title.trim()}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
            >
              Create Task
            </button>
            <button
              onClick={() => setShowTaskForm(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
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
                  <p className="text-2xl font-bold text-blue-600">{Math.round(analytics.completion_rate * 100)}%</p>
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
                    <div key={task.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                          {task.estimated_duration && (
                            <span>{task.estimated_duration} min</span>
                          )}
                          {task.completed_at && (
                            <span>Completed: {new Date(task.completed_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
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
              
              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{apiError}</p>
                  <button
                    onClick={() => setApiError(null)}
                    className="text-red-600 text-sm underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
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
                    className={`p-3 rounded-lg max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-indigo-100 text-indigo-900 ml-auto'
                        : message.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-white text-gray-900 border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-white border rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask your coach anything..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-300 text-sm"
                  onKeyPress={handleKeyPress}
                  disabled={chatLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={chatLoading || !newMessage.trim()}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
                >
                  {chatLoading ? '...' : 'Send'}
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
                  onClick={() => {
                    alert('Generating your personalized weekly plan...\n\nThis feature will be enhanced with real AI in the next version!');
                  }}
                  className="w-full bg-indigo-100 text-indigo-700 p-3 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                  📅 Generate Weekly Plan
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
