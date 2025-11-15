import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle, AlertCircle, BookOpen, Trophy } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const FlashcardTab = ({ language }) => {
  const { user } = useAuth();
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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (showResults || vocabularyWords.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {vocabularyWords.length === 0 ? (
            <>
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Cards to Review</h3>
              <p className="text-gray-600 mb-6">
                You're all caught up! Add more vocabulary words or come back later when cards are due for review.
              </p>
              <button
                onClick={resetSession}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            </>
          ) : (
            <>
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Session Complete!</h3>
              <p className="text-gray-600 mb-6">Great job reviewing your vocabulary!</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Cards Reviewed:</span>
                  <span className="font-bold text-gray-900">{sessionStats.reviewed}</span>
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
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
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
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{sessionStats.reviewed} / {sessionStats.total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(sessionStats.reviewed / sessionStats.total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative w-full max-w-lg cursor-pointer"
        style={{ perspective: '1000px', height: '400px' }}
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
            className="absolute w-full h-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <p className="text-sm text-gray-500 mb-4">Word in {language}</p>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">{currentCard.word}</h2>
            {currentCard.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {currentCard.category}
              </span>
            )}
            <p className="text-gray-400 mt-8 text-sm">Click to reveal translation</p>
          </div>

          {/* Back of Card */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-white"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-sm text-blue-100 mb-4">Translation</p>
            <h2 className="text-4xl font-bold mb-4">{currentCard.translation}</h2>
            {currentCard.example_sentence && (
              <div className="mt-6 p-4 bg-white bg-opacity-20 rounded-lg max-w-md">
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
        <div className="w-full max-w-lg mt-8 grid grid-cols-3 gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDifficultyRating('hard');
            }}
            className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg flex flex-col items-center space-y-2 transition-colors"
          >
            <XCircle className="h-6 w-6" />
            <span className="font-medium">Hard</span>
            <span className="text-xs">Review tomorrow</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDifficultyRating('medium');
            }}
            className="p-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex flex-col items-center space-y-2 transition-colors"
          >
            <AlertCircle className="h-6 w-6" />
            <span className="font-medium">Medium</span>
            <span className="text-xs">Review in 3 days</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDifficultyRating('easy');
            }}
            className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg flex flex-col items-center space-y-2 transition-colors"
          >
            <CheckCircle className="h-6 w-6" />
            <span className="font-medium">Easy</span>
            <span className="text-xs">Review in 7+ days</span>
          </button>
        </div>
      )}

      {!isFlipped && (
        <p className="text-gray-500 text-sm mt-4">Click the card to see the translation</p>
      )}
    </div>
  );
};

export default FlashcardTab;
