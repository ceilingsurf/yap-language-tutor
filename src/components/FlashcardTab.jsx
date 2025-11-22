import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle, AlertCircle, BookOpen, Trophy, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useVoice from '../hooks/useVoice';

const FlashcardTab = ({ language }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { isSpeaking, speakingId, toggleSpeak } = useVoice({ rate: 0.9 });
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    reviewed: 0,
    easy: 0,
    medium: 0,
    hard: 0
  });
  const [showResults, setShowResults] = useState(false);

  // Load vocabulary that's due for review
  useEffect(() => {
    loadVocabulary();
  }, [user, language]);

  const loadVocabulary = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Get words that are due for review or have never been reviewed
      const { data, error } = await supabase
        .from('vocabulary_words')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', language)
        .or(`next_review_at.is.null,next_review_at.lte.${now}`)
        .order('last_reviewed_at', { ascending: true, nullsFirst: true })
        .limit(20); // Limit to 20 cards per session

      if (error) throw error;

      setVocabularyWords(data || []);
      setSessionStats(prev => ({ ...prev, total: data?.length || 0 }));
      setShowResults(false);
      setCurrentCardIndex(0);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Spaced Repetition Algorithm (SM-2 inspired)
  const calculateNextReview = (difficulty, currentMasteryLevel) => {
    const now = new Date();
    let daysUntilNextReview;
    let newMasteryLevel = currentMasteryLevel;

    switch (difficulty) {
      case 'easy':
        daysUntilNextReview = Math.max(7, currentMasteryLevel * 2);
        newMasteryLevel = Math.min(5, currentMasteryLevel + 1);
        break;
      case 'medium':
        daysUntilNextReview = Math.max(3, currentMasteryLevel);
        // Mastery level stays the same
        break;
      case 'hard':
        daysUntilNextReview = 1;
        newMasteryLevel = Math.max(0, currentMasteryLevel - 1);
        break;
      default:
        daysUntilNextReview = 3;
    }

    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNextReview);

    return {
      nextReviewDate: nextReviewDate.toISOString(),
      newMasteryLevel
    };
  };

  const handleDifficultyRating = async (difficulty) => {
    if (!user || currentCardIndex >= vocabularyWords.length) return;

    const currentCard = vocabularyWords[currentCardIndex];
    const { nextReviewDate, newMasteryLevel } = calculateNextReview(
      difficulty,
      currentCard.mastery_level
    );

    try {
      // Update vocabulary word
      await supabase
        .from('vocabulary_words')
        .update({
          mastery_level: newMasteryLevel,
          times_reviewed: (currentCard.times_reviewed || 0) + 1,
          last_reviewed_at: new Date().toISOString(),
          next_review_at: nextReviewDate
        })
        .eq('id', currentCard.id);

      // Record flashcard review
      await supabase
        .from('flashcard_reviews')
        .insert({
          vocabulary_id: currentCard.id,
          user_id: user.id,
          difficulty
        });

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        [difficulty]: prev[difficulty] + 1
      }));

      // Move to next card or show results
      if (currentCardIndex + 1 >= vocabularyWords.length) {
        setShowResults(true);
      } else {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  const resetSession = () => {
    loadVocabulary();
    setSessionStats({
      total: 0,
      reviewed: 0,
      easy: 0,
      medium: 0,
      hard: 0
    });
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-dark-text-secondary' : 'text-gray-600'}>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (showResults || vocabularyWords.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center p-3 md:p-4 ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <div className={`rounded-lg shadow-lg p-6 md:p-8 max-w-md w-full text-center ${
          isDark ? 'bg-dark-surface' : 'bg-white'
        }`}>
          {vocabularyWords.length === 0 ? (
            <>
              <BookOpen className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 ${isDark ? 'text-dark-text-secondary' : 'text-gray-300'}`} />
              <h3 className={`text-lg md:text-xl font-bold mb-2 ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>No Cards to Review</h3>
              <p className={`text-sm md:text-base mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>
                You're all caught up! Add more vocabulary words or come back later when cards are due for review.
              </p>
              <button
                onClick={resetSession}
                className="px-6 py-2.5 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                Refresh
              </button>
            </>
          ) : (
            <>
              <Trophy className="h-12 w-12 md:h-16 md:w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className={`text-xl md:text-2xl font-bold mb-2 ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>Session Complete!</h3>
              <p className={`text-sm md:text-base mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>Great job reviewing your vocabulary!</p>

              <div className="space-y-3 mb-6">
                <div className={`flex justify-between items-center p-3 rounded ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                  <span className={isDark ? 'text-dark-text' : 'text-gray-700'}>Cards Reviewed:</span>
                  <span className={`font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{sessionStats.reviewed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-green-700">Easy:</span>
                  <span className="font-bold text-green-900">{sessionStats.easy}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="text-yellow-700">Medium:</span>
                  <span className="font-bold text-yellow-900">{sessionStats.medium}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span className="text-red-700">Hard:</span>
                  <span className="font-bold text-red-900">{sessionStats.hard}</span>
                </div>
              </div>

              <button
                onClick={resetSession}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center space-x-2 transition-colors text-base"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Start New Session</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentCard = vocabularyWords[currentCardIndex];

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-3 md:p-4 ${
      isDark ? 'bg-dark-bg' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-4 md:mb-6 px-2">
        <div className={`flex justify-between text-xs md:text-sm mb-2 ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>
          <span className="font-medium">Progress</span>
          <span className="font-medium">{sessionStats.reviewed} / {sessionStats.total}</span>
        </div>
        <div className={`w-full rounded-full h-2 md:h-2.5 ${isDark ? 'bg-dark-border' : 'bg-gray-200'}`}>
          <div
            className="bg-blue-600 h-2 md:h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(sessionStats.reviewed / sessionStats.total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative w-full max-w-lg cursor-pointer touch-manipulation"
        style={{
          perspective: '1000px',
          height: window.innerWidth < 768 ? '350px' : '400px'
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          {/* Front of Card */}
          <div
            className={`absolute w-full h-full rounded-xl md:rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col items-center justify-center ${
              isDark ? 'bg-dark-surface' : 'bg-white'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Voice button for front */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSpeak(currentCard.word, language, `front-${currentCard.id}`);
              }}
              className={`absolute top-4 right-4 p-3 rounded-full transition-all ${
                isDark ? 'bg-dark-bg hover:bg-dark-border' : 'bg-gray-100 hover:bg-gray-200'
              } ${isSpeaking && speakingId === `front-${currentCard.id}` ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              aria-label={isSpeaking && speakingId === `front-${currentCard.id}` ? 'Stop speaking' : 'Speak word'}
            >
              {isSpeaking && speakingId === `front-${currentCard.id}` ? (
                <VolumeX className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              ) : (
                <Volume2 className={`h-5 w-5 ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`} />
              )}
            </button>

            <p className={`text-xs md:text-sm mb-3 md:mb-4 ${isDark ? 'text-dark-text-secondary' : 'text-gray-500'}`}>Word in {language}</p>
            <h2 className={`text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-center px-4 ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>{currentCard.word}</h2>
            {currentCard.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {currentCard.category}
              </span>
            )}
            <p className={`mt-6 md:mt-8 text-xs md:text-sm ${isDark ? 'text-dark-text-secondary' : 'text-gray-400'}`}>Tap to reveal translation</p>
          </div>

          {/* Back of Card */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col items-center justify-center text-white"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Voice button for back - speaks the word again */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSpeak(currentCard.word, language, `back-${currentCard.id}`);
              }}
              className={`absolute top-4 right-4 p-3 rounded-full transition-all ${
                isSpeaking && speakingId === `back-${currentCard.id}` ? 'bg-blue-800' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              aria-label={isSpeaking && speakingId === `back-${currentCard.id}` ? 'Stop speaking' : 'Speak word'}
            >
              {isSpeaking && speakingId === `back-${currentCard.id}` ? (
                <VolumeX className="h-5 w-5 text-blue-200" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>

            <p className="text-xs md:text-sm text-blue-100 mb-3 md:mb-4">Translation</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-center px-4">{currentCard.translation}</h2>
            {currentCard.example_sentence && (
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-white bg-opacity-20 rounded-lg max-w-md w-full mx-4">
                <p className="italic text-sm mb-2">"{currentCard.example_sentence}"</p>
                {currentCard.example_translation && (
                  <p className="text-xs text-blue-100">{currentCard.example_translation}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      {isFlipped && (
        <div className="w-full max-w-lg mt-6 md:mt-8 grid grid-cols-3 gap-2 md:gap-4 px-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDifficultyRating('hard');
            }}
            className="p-3 md:p-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg flex flex-col items-center space-y-1 md:space-y-2 transition-colors touch-manipulation min-h-[88px]"
          >
            <XCircle className="h-6 w-6 md:h-7 md:w-7" />
            <span className="font-medium text-sm md:text-base">Hard</span>
            <span className="text-xs hidden sm:inline">Review tomorrow</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDifficultyRating('medium');
            }}
            className="p-3 md:p-4 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white rounded-lg flex flex-col items-center space-y-1 md:space-y-2 transition-colors touch-manipulation min-h-[88px]"
          >
            <AlertCircle className="h-6 w-6 md:h-7 md:w-7" />
            <span className="font-medium text-sm md:text-base">Medium</span>
            <span className="text-xs hidden sm:inline">Review in 3 days</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDifficultyRating('easy');
            }}
            className="p-3 md:p-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg flex flex-col items-center space-y-1 md:space-y-2 transition-colors touch-manipulation min-h-[88px]"
          >
            <CheckCircle className="h-6 w-6 md:h-7 md:w-7" />
            <span className="font-medium text-sm md:text-base">Easy</span>
            <span className="text-xs hidden sm:inline">Review in 7+ days</span>
          </button>
        </div>
      )}

      {!isFlipped && (
        <p className={`text-xs md:text-sm mt-4 px-4 text-center ${isDark ? 'text-dark-text-secondary' : 'text-gray-500'}`}>Tap the card to see the translation</p>
      )}
    </div>
  );
};

export default FlashcardTab;
