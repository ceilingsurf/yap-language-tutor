import React from 'react';
import { X, Volume2, TrendingUp, Target, MessageSquare, BarChart3, CheckCircle } from 'lucide-react';

/**
 * Mobile Sidebar - Overlay panel for mobile devices
 * Shows Progress, Goals, Voice Settings, and Feedback
 */
const MobileSidebar = ({
  isOpen,
  onClose,
  voiceSettings,
  setVoiceSettings,
  userProfile,
  learningGoals,
  toggleGoalCompletion,
  addCustomGoal,
  feedback,
  progressStats
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 overflow-y-auto md:hidden animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Settings and progress"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-800">Progress & Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col">
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
                  role="switch"
                  aria-checked={voiceSettings.autoPlay}
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
          <div className="p-4">
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
      </div>
    </>
  );
};

export default MobileSidebar;
