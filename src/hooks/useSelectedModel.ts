import { useState, useEffect } from "react";
import { Model } from "../models/chat";

const SELECTED_MODEL_KEY = "wingman-chat-selected-model";

export function useSelectedModel(models: Model[]) {
  const [selectedModel, setSelectedModelState] = useState<Model | null>(null);

  // Load selected model from localStorage on mount
  useEffect(() => {
    if (models.length === 0) return;

    try {
      const savedModelId = localStorage.getItem(SELECTED_MODEL_KEY);
      if (savedModelId) {
        // Find the saved model in the current models list
        const savedModel = models.find(model => model.id === savedModelId);
        if (savedModel) {
          setSelectedModelState(savedModel);
          return;
        }
      }
    } catch (error) {
      console.warn("Failed to load selected model from localStorage:", error);
    }

    // If no saved model or saved model not found, use the first available model
    if (models[0]) {
      setSelectedModelState(models[0]);
    }
  }, [models]);

  // Function to update selected model and save to localStorage
  const setSelectedModel = (model: Model | null) => {
    setSelectedModelState(model);
    
    try {
      if (model) {
        localStorage.setItem(SELECTED_MODEL_KEY, model.id);
      } else {
        localStorage.removeItem(SELECTED_MODEL_KEY);
      }
    } catch (error) {
      console.warn("Failed to save selected model to localStorage:", error);
    }
  };

  return {
    selectedModel,
    setSelectedModel,
  };
}
