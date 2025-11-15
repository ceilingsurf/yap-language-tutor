import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Star, Trash2, Edit2, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const VocabularyTab = ({ language }) => {
  const { user } = useAuth();
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'verbs', 'nouns', 'adjectives', 'phrases', 'other'];

  // Load vocabulary from Supabase
  useEffect(() => {
    loadVocabulary();
  }, [user, language]);

  // Filter words based on search and category
  useEffect(() => {
    let filtered = vocabularyWords;

    if (searchTerm) {
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.translation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(word => word.category === selectedCategory);
    }

    setFilteredWords(filtered);
  }, [vocabularyWords, searchTerm, selectedCategory]);

  const loadVocabulary = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vocabulary_words')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', language)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVocabularyWords(data || []);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryStars = (level) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < level ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getCategoryColor = (category) => {
    const colors = {
      verbs: 'bg-blue-100 text-blue-800',
      nouns: 'bg-green-100 text-green-800',
      adjectives: 'bg-purple-100 text-purple-800',
      phrases: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const deleteWord = async (wordId) => {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
      const { error } = await supabase
        .from('vocabulary_words')
        .delete()
        .eq('id', wordId);

      if (error) throw error;

      setVocabularyWords(prev => prev.filter(w => w.id !== wordId));
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">My Vocabulary</h2>
            <span className="text-sm text-gray-500">({filteredWords.length} words)</span>
          </div>
          <button
            onClick={() => {
              setEditingWord(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Word</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vocabulary..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vocabulary...</p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'No words found' : 'No vocabulary yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start adding words to build your vocabulary'}
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Word
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map(word => (
              <div
                key={word.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{word.word}</h3>
                    <p className="text-sm text-gray-600">{word.translation}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingWord(word);
                        setShowAddModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteWord(word.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {word.category && (
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryColor(word.category)}`}>
                    {word.category}
                  </span>
                )}

                {word.example_sentence && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <p className="text-gray-700 italic">"{word.example_sentence}"</p>
                    {word.example_translation && (
                      <p className="text-gray-500 text-xs mt-1">{word.example_translation}</p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {getMasteryStars(word.mastery_level)}
                  </div>
                  <span className="text-xs text-gray-500">
                    Reviewed {word.times_reviewed || 0} times
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Word Modal */}
      {showAddModal && (
        <AddWordModal
          word={editingWord}
          language={language}
          onClose={() => {
            setShowAddModal(false);
            setEditingWord(null);
          }}
          onSave={loadVocabulary}
        />
      )}
    </div>
  );
};

// Add Word Modal Component
const AddWordModal = ({ word, language, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    word: word?.word || '',
    translation: word?.translation || '',
    category: word?.category || 'other',
    example_sentence: word?.example_sentence || '',
    example_translation: word?.example_translation || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      if (word) {
        // Update existing word
        const { error } = await supabase
          .from('vocabulary_words')
          .update({
            ...formData,
            language
          })
          .eq('id', word.id);

        if (error) throw error;
      } else {
        // Add new word
        const { error } = await supabase
          .from('vocabulary_words')
          .insert({
            user_id: user.id,
            language,
            ...formData,
            mastery_level: 0,
            times_reviewed: 0
          });

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving word:', error);
      alert('Failed to save word. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {word ? 'Edit Word' : 'Add New Word'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Word (in {language})
            </label>
            <input
              type="text"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Translation (English)
            </label>
            <input
              type="text"
              value={formData.translation}
              onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="verbs">Verbs</option>
              <option value="nouns">Nouns</option>
              <option value="adjectives">Adjectives</option>
              <option value="phrases">Phrases</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Example Sentence (Optional)
            </label>
            <textarea
              value={formData.example_sentence}
              onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Example Translation (Optional)
            </label>
            <textarea
              value={formData.example_translation}
              onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : word ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VocabularyTab;
