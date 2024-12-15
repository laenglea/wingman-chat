import { useState, useEffect, useRef } from "react";
import { Model } from "../models/chat";

type ChatModelProps = {
  models: Model[];
  selectedModel: Model;
  onSelectModel: (model: Model) => void;
};

export function ChatModel({
  models,
  selectedModel,
  onSelectModel,
}: ChatModelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#e5e5e5] text-left hover:text-gray-300 bg-[#1c1c1e] rounded min-w-40"
      >
        {selectedModel.name ?? selectedModel.id}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-md shadow-lg">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelectModel(model);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-[#e5e5e5] hover:bg-[#2c2c2e] first:rounded-t-md last:rounded-b-md"
            >
              {model.name ?? model.id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
