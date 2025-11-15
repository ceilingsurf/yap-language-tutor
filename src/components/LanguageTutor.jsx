import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Target, TrendingUp, MessageSquare, CheckCircle, BarChart3, Languages, Mic, Volume2, Pause, LogOut, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import VocabularyTab from './VocabularyTab';
import FlashcardTab from './FlashcardTab';

const LanguageTutor = () => {
  const { user, signOut } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('spanish');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.9,
    autoPlay: true
  });
  const [userProfile, setUserProfile] = useState({
    proficiencyLevel: 'Beginner',
    totalMessages: 0,
    vocabularyCount: new Set(),
    grammarAccuracy: 0,
    sessionCount: 0
  });
  const [learningGoals, setLearningGoals] = useState([
    { id: 1, text: 'Master basic greetings', completed: false, progress: 20 },
    { id: 2, text: 'Learn present tense verbs', completed: false, progress: 10 },
    { id: 3, text: 'Expand food vocabulary', completed: false, progress: 0 }
  ]);
  const [feedback, setFeedback] = useState(null);
  const [showLessonMode, setShowLessonMode] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // 'chat', 'vocabulary', 'flashcards'
  const [conversationId, setConversationId] = useState(null);
  const [translatedMessages, setTranslatedMessages] = useState(new Set());
  const [progressStats, setProgressStats] = useState({
    vocabularyGrowth: [20, 35, 50, 65, 78],
    grammarAccuracy: [60, 65, 70, 75, 80],
    conversationLength: [5, 8, 12, 15, 18]
  });
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const languages = {
    spanish: { name: 'Spanish (Español)', flag: '🇪🇸', code: 'es-ES' },
    french: { name: 'French (Français)', flag: '🇫🇷', code: 'fr-FR' },
    german: { name: 'German (Deutsch)', flag: '🇩🇪', code: 'de-DE' },
    japanese: { name: 'Japanese (日本語)', flag: '🇯🇵', code: 'ja-JP' },
    italian: { name: 'Italian (Italiano)', flag: '🇮🇹', code: 'it-IT' },
    portuguese: { name: 'Portuguese (Português)', flag: '🇵🇹', code: 'pt-PT' },
    chinese: { name: 'Chinese (中文)', flag: '🇨🇳', code: 'zh-CN' },
    korean: { name: 'Korean (한국어)', flag: '🇰🇷', code: 'ko-KR' }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Load user profile and learning goals from Supabase
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        // Load user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', profileError);
        } else if (profile) {
          setUserProfile({
            proficiencyLevel: profile.proficiency_level || 'Beginner',
            totalMessages: profile.total_messages || 0,
            vocabularyCount: new Set(),
            grammarAccuracy: profile.grammar_accuracy || 0,
            sessionCount: profile.session_count || 0
          });
          setSelectedLanguage(profile.preferred_language || 'spanish');
        }

        // Load learning goals
        const { data: goals, error: goalsError } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('language', selectedLanguage)
          .order('created_at', { ascending: true });

        if (goalsError) {
          console.error('Error loading goals:', goalsError);
        } else if (goals && goals.length > 0) {
          setLearningGoals(goals.map(g => ({
            id: g.id,
            text: g.goal_text,
            completed: g.completed,
            progress: g.progress
          })));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  // Save user profile changes to Supabase
  useEffect(() => {
    const saveUserProfile = async () => {
      if (!user) return;

      try {
        await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email,
            proficiency_level: userProfile.proficiencyLevel,
            preferred_language: selectedLanguage,
            total_messages: userProfile.totalMessages,
            grammar_accuracy: userProfile.grammarAccuracy,
            session_count: userProfile.sessionCount,
            vocabulary_count: userProfile.vocabularyCount.size,
            updated_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    };

    if (userProfile.totalMessages > 0) {
      saveUserProfile();
    }
  }, [user, userProfile, selectedLanguage]);

  // Create or load conversation for current language
  useEffect(() => {
    const initConversation = async () => {
      if (!user) return;

      try {
        // Try to find an existing recent conversation for this language
        const { data: existingConversations, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('language', selectedLanguage)
          .eq('lesson_mode', showLessonMode)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingConversations && existingConversations.length > 0) {
          const conversation = existingConversations[0];
          setConversationId(conversation.id);

          // Load messages for this conversation
          const { data: loadedMessages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          if (messagesError) throw messagesError;

          if (loadedMessages && loadedMessages.length > 0) {
            setMessages(loadedMessages.map(m => ({
              id: m.id,
              text: m.text,
              englishTranslation: m.english_translation,
              sender: m.sender,
              timestamp: new Date(m.created_at)
            })));
          }
        } else {
          // Create a new conversation
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              language: selectedLanguage,
              lesson_mode: showLessonMode,
              title: `${languages[selectedLanguage].name} Practice`
            })
            .select()
            .single();

          if (createError) throw createError;

          setConversationId(newConversation.id);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
      }
    };

    initConversation();
  }, [user, selectedLanguage, showLessonMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      recognitionRef.current.lang = languages[selectedLanguage].code;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text, messageId = null) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languages[selectedLanguage].code;
    utterance.rate = voiceSettings.rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const languageVoice = voices.find(voice => voice.lang.startsWith(languages[selectedLanguage].code));
    if (languageVoice) {
      utterance.voice = languageVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (messageId) setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  const getProficiencyColor = (level) => {
    const colors = {
      'Beginner': 'text-green-600 bg-green-100',
      'Intermediate': 'text-yellow-600 bg-yellow-100',
      'Advanced': 'text-red-600 bg-red-100',
      'Native': 'text-purple-600 bg-purple-100'
    };
    return colors[level] || colors.Beginner;
  };

  const generateLearningGoals = (level, language) => {
    const goalsByLevel = {
      Beginner: {
        spanish: [
          'Master basic greetings and introductions',
          'Learn present tense regular verbs',
          'Build food and drink vocabulary',
          'Practice numbers 1-100',
          'Use basic question words (qué, cómo, dónde)'
        ],
        french: [
          'Master basic greetings (bonjour, bonsoir)',
          'Learn present tense être and avoir',
          'Build family and home vocabulary',
          'Practice French pronunciation',
          'Use basic question words'
        ],
        german: [
          'Master basic greetings and politeness',
          'Learn German cases (Nominativ, Akkusativ)',
          'Build everyday vocabulary',
          'Practice German pronunciation',
          'Learn basic sentence structure'
        ]
      }
    };

    const goals = goalsByLevel[level]?.[language] || goalsByLevel.Beginner.spanish;
    return goals.slice(0, 3).map((text, index) => ({
      id: Date.now() + index,
      text,
      completed: false,
      progress: Math.floor(Math.random() * 30)
    }));
  };

  const analyzeProficiencyLevel = (messageHistory) => {
    if (messageHistory.length < 3) return 'Beginner';
    if (messageHistory.length < 10) return 'Beginner';
    if (messageHistory.length < 20) return 'Intermediate';
    return 'Advanced';
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Save user message to Supabase
    if (user && conversationId) {
      try {
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            sender: 'user',
            text: userMessage.text
          });
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    try {
      const conversationHistory = [...messages, userMessage];
      const detectedLevel = analyzeProficiencyLevel(conversationHistory);
      
      const prompt = `You are a friendly, encouraging language tutor helping someone learn ${languages[selectedLanguage].name}.

Conversation history: ${JSON.stringify(conversationHistory.slice(-5).map(m => ({ sender: m.sender, text: m.text })))}

Current user message: "${currentMessage}"
User's proficiency level: ${detectedLevel}
Learning goals: ${learningGoals.map(g => g.text).join(', ')}
Lesson mode: ${showLessonMode}

Respond with a JSON object in this exact format:
{
  "tutorResponse": "Your encouraging response in ${languages[selectedLanguage].name}. ${showLessonMode ? 'Focus on teaching specific grammar or vocabulary.' : 'Keep the conversation natural and flowing.'}",
  "englishTranslation": "The exact same response translated to English",
  "feedback": {
    "positive": ["Positive aspects of their language use"],
    "corrections": ["Gentle corrections if needed"],
    "suggestions": ["Helpful suggestions for improvement"]
  },
  "grammarAnalysis": {
    "accuracy": 85,
    "detectedLevel": "${detectedLevel}",
    "strengths": ["Areas they did well"],
    "improvements": ["Areas to work on"]
  },
  "vocabularyUsed": ["words", "they", "used"],
  "progressNotes": "Brief encouraging note about their progress"
}

Your entire response MUST be valid JSON only. DO NOT include any text outside the JSON structure.`;

       const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      const content = data.content.find(item => item.type === "text")?.text || "";
      
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const parsedResponse = JSON.parse(cleanedContent);

      const tutorMessage = {
        id: Date.now() + 1,
        text: parsedResponse.tutorResponse,
        englishTranslation: parsedResponse.englishTranslation,
        sender: 'tutor',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, tutorMessage]);
      setFeedback(parsedResponse.feedback);

      // Save tutor message to Supabase
      if (user && conversationId) {
        try {
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              user_id: user.id,
              sender: 'tutor',
              text: tutorMessage.text,
              english_translation: tutorMessage.englishTranslation,
              feedback: parsedResponse.feedback,
              grammar_analysis: parsedResponse.grammarAnalysis,
              vocabulary_used: parsedResponse.vocabularyUsed
            });
        } catch (error) {
          console.error('Error saving tutor message:', error);
        }
      }

      if (voiceSettings.autoPlay) {
        setTimeout(() => {
          speakText(parsedResponse.tutorResponse, tutorMessage.id);
        }, 500);
      }

      setUserProfile(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        proficiencyLevel: parsedResponse.grammarAnalysis.detectedLevel,
        grammarAccuracy: parsedResponse.grammarAnalysis.accuracy,
        vocabularyCount: new Set([...prev.vocabularyCount, ...parsedResponse.vocabularyUsed])
      }));

      if (userProfile.totalMessages % 5 === 0) {
        setProgressStats(prev => ({
          vocabularyGrowth: [...prev.vocabularyGrowth, userProfile.vocabularyCount.size],
          grammarAccuracy: [...prev.grammarAccuracy, parsedResponse.grammarAnalysis.accuracy],
          conversationLength: [...prev.conversationLength, conversationHistory.length]
        }));
      }

    } catch (error) {
      console.error('Error getting tutor response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: error.message || 'Sorry, I had trouble responding. Please check your API key and try again.',
        sender: 'tutor',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    setMessages([]);
    setFeedback(null);
    setTranslatedMessages(new Set());
    stopSpeaking();
    const newGoals = generateLearningGoals(userProfile.proficiencyLevel, newLang);
    setLearningGoals(newGoals);
  };

  const toggleGoalCompletion = async (goalId) => {
    const updatedGoal = learningGoals.find(g => g.id === goalId);
    if (!updatedGoal) return;

    const newCompleted = !updatedGoal.completed;
    const newProgress = newCompleted ? 100 : updatedGoal.progress;

    setLearningGoals(prev =>
      prev.map(goal =>
        goal.id === goalId
          ? { ...goal, completed: newCompleted, progress: newProgress }
          : goal
      )
    );

    // Save to Supabase
    if (user) {
      try {
        await supabase
          .from('learning_goals')
          .update({
            completed: newCompleted,
            progress: newProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', goalId);
      } catch (error) {
        console.error('Error updating goal:', error);
      }
    }
  };

  const toggleMessageTranslation = (messageId) => {
    setTranslatedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const addCustomGoal = async () => {
    const goalText = prompt('Enter your learning goal:');
    if (goalText?.trim() && user) {
      try {
        const { data, error } = await supabase
          .from('learning_goals')
          .insert({
            user_id: user.id,
            language: selectedLanguage,
            goal_text: goalText.trim(),
            completed: false,
            progress: 0
          })
          .select()
          .single();

        if (error) throw error;

        const newGoal = {
          id: data.id,
          text: data.goal_text,
          completed: data.completed,
          progress: data.progress
        };
        setLearningGoals(prev => [...prev, newGoal]);
      } catch (error) {
        console.error('Error adding goal:', error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800">YAP Language Tutor</h1>
              </div>
              
              <select 
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(languages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>

              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProficiencyColor(userProfile.proficiencyLevel)}`}>
                {userProfile.proficiencyLevel}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {activeView === 'chat' && (
                <button
                  onClick={() => setShowLessonMode(!showLessonMode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    showLessonMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {showLessonMode ? 'Lesson Mode' : 'Chat Mode'}
                </button>
              )}
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="px-3 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center space-x-1"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-t border-gray-200 mt-4 -mb-4 -mx-4 px-4">
            <button
              onClick={() => setActiveView('chat')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'chat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('vocabulary')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'vocabulary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Library className="h-4 w-4" />
                <span>Vocabulary</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('flashcards')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'flashcards'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Flashcards</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeView === 'vocabulary' ? (
          <VocabularyTab language={selectedLanguage} />
        ) : activeView === 'flashcards' ? (
          <FlashcardTab language={selectedLanguage} />
        ) : (
          <>
            {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">{languages[selectedLanguage].flag}</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Ready to practice {languages[selectedLanguage].name}?
              </h2>
              <p className="text-gray-500 mb-4">
                Start a conversation and I'll help you learn with personalized feedback!
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Mic className="h-4 w-4" />
                <span>Click the microphone to speak</span>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors'
              }`}>
                {message.sender === 'tutor' && (
                  <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMessageTranslation(message.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Languages className="h-3 w-3 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSpeaking && speakingMessageId === message.id) {
                          stopSpeaking();
                        } else {
                          speakText(message.text, message.id);
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isSpeaking && speakingMessageId === message.id ? (
                        <Pause className="h-3 w-3 text-blue-600" />
                      ) : (
                        <Volume2 className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
                <p className="pr-8">
                  {message.sender === 'tutor' && translatedMessages.has(message.id) 
                    ? message.englishTranslation || message.text
                    : message.text
                  }
                </p>
                {message.sender === 'tutor' && translatedMessages.has(message.id) && (
                  <p className="text-xs mt-1 text-gray-500 italic">
                    English translation
                  </p>
                )}
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-gray-500">Tutor is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`p-3 rounded-md transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? 'Listening...' : 'Click to speak'}
            >
              <Mic className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`Type your message in ${languages[selectedLanguage].name}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading || isListening}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !currentMessage.trim() || isListening}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {isListening && (
            <p className="text-sm text-red-600 mt-2 flex items-center">
              <span className="animate-pulse mr-2">●</span>
              Listening...
            </p>
          )}
        </div>
          </>
        )}
      </div>

      {/* Sidebar - Only show in chat mode */}
      {activeView === 'chat' && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
        {/* Voice Settings */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Voice Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Speaking Speed: {voiceSettings.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSettings.rate}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Auto-play responses</label>
              <button
                onClick={() => setVoiceSettings(prev => ({ ...prev, autoPlay: !prev.autoPlay }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  voiceSettings.autoPlay ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    voiceSettings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Progress Overview
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Messages:</span>
              <span className="font-medium">{userProfile.totalMessages}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Vocabulary:</span>
              <span className="font-medium">{userProfile.vocabularyCount.size} words</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Accuracy:</span>
              <span className="font-medium">{userProfile.grammarAccuracy}%</span>
            </div>
          </div>
        </div>

        {/* Learning Goals */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Learning Goals
            </h3>
            <button
              onClick={addCustomGoal}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {learningGoals.map((goal) => (
              <div key={goal.id} className="p-2 bg-gray-50 rounded-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm ${goal.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {goal.text}
                    </p>
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleGoalCompletion(goal.id)}
                    className="ml-2 mt-1"
                  >
                    {goal.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Feedback */}
        {feedback && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Feedback
            </h3>
            {feedback.positive.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-green-600 mb-1">Great job!</p>
                {feedback.positive.map((item, idx) => (
                  <p key={idx} className="text-sm text-green-700 bg-green-50 p-2 rounded mb-1">
                    {item}
                  </p>
                ))}
              </div>
            )}
            {feedback.corrections.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-orange-600 mb-1">Small corrections:</p>
                {feedback.corrections.map((item, idx) => (
                  <p key={idx} className="text-sm text-orange-700 bg-orange-50 p-2 rounded mb-1">
                    {item}
                  </p>
                ))}
              </div>
            )}
            {feedback.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-blue-600 mb-1">Try this:</p>
                {feedback.suggestions.map((item, idx) => (
                  <p key={idx} className="text-sm text-blue-700 bg-blue-50 p-2 rounded mb-1">
                    {item}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Learning Stats
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vocabulary Growth</p>
              <div className="flex items-end space-x-1 h-8">
                {progressStats.vocabularyGrowth.slice(-5).map((value, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-600 rounded-t"
                    style={{ height: `${(value / 100) * 100}%`, width: '20%' }}
                  ></div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Grammar Accuracy</p>
              <div className="flex items-end space-x-1 h-8">
                {progressStats.grammarAccuracy.slice(-5).map((value, idx) => (
                  <div
                    key={idx}
                    className="bg-green-600 rounded-t"
                    style={{ height: `${value}%`, width: '20%' }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default LanguageTutor;
