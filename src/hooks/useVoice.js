import { useState, useCallback } from 'react';

/**
 * Custom hook for text-to-speech functionality
 * @param {Object} options - Configuration options
 * @param {number} options.rate - Speech rate (0.5-2.0, default 0.9)
 * @returns {Object} Voice control functions and state
 */
const useVoice = ({ rate = 0.9 } = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);

  // Language code mapping
  const languages = {
    spanish: { code: 'es-ES' },
    french: { code: 'fr-FR' },
    german: { code: 'de-DE' },
    japanese: { code: 'ja-JP' },
    italian: { code: 'it-IT' },
    portuguese: { code: 'pt-PT' },
    chinese: { code: 'zh-CN' },
    korean: { code: 'ko-KR' }
  };

  /**
   * Speak text using Web Speech API
   * @param {string} text - Text to speak
   * @param {string} language - Language key (e.g., 'spanish', 'french')
   * @param {string|number} itemId - Optional ID to track which item is speaking
   */
  const speakText = useCallback((text, language = 'spanish', itemId = null) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const languageCode = languages[language]?.code || 'es-ES';

    utterance.lang = languageCode;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Find and set the appropriate voice for the language
    const voices = window.speechSynthesis.getVoices();
    const languageVoice = voices.find(voice => voice.lang.startsWith(languageCode));
    if (languageVoice) {
      utterance.voice = languageVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (itemId !== null) setSpeakingId(itemId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingId(null);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [rate]);

  /**
   * Stop any ongoing speech
   */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, []);

  /**
   * Toggle speech for a specific item
   * @param {string} text - Text to speak
   * @param {string} language - Language key
   * @param {string|number} itemId - ID of the item
   */
  const toggleSpeak = useCallback((text, language, itemId) => {
    if (isSpeaking && speakingId === itemId) {
      stopSpeaking();
    } else {
      speakText(text, language, itemId);
    }
  }, [isSpeaking, speakingId, speakText, stopSpeaking]);

  return {
    isSpeaking,
    speakingId,
    speakText,
    stopSpeaking,
    toggleSpeak
  };
};

export default useVoice;
