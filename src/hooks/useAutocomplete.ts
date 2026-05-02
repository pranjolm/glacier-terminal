import { useState, useCallback } from 'react';

export function useAutocomplete() {
  const [suggestion, setSuggestion] = useState('');

  const handleSuggestion = useCallback((text: string) => {
    setSuggestion(text);
  }, []);

  const clearSuggestion = useCallback(() => {
    setSuggestion('');
  }, []);

  return { suggestion, handleSuggestion, clearSuggestion };
}
