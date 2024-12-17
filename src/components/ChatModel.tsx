import { useState } from "react";
import { Model } from "../models/chat";

type ChatModelProps = {
  models: Model[];
  selectedModel: Model | null;
  onSelectModel: (model: Model) => void;
};

export function ChatModel({
  models,
  selectedModel,
  onSelectModel,
}: ChatModelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleModelSelect = (model: Model) => {
    onSelectModel(model);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={toggleDropdown}
        className="p-2 text-[#e5e5e5] hover:text-gray-300 bg-[#1c1c1e] rounded"
      >
        {selectedModel?.name ?? selectedModel?.id ?? "Select Model"}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 max-h-[50vh] bg-[#1c1c1e] border border-[#3a3a3c] rounded shadow-lg z-10 overflow-y-auto whitespace-nowrap">
          <ul className="py-1">
            {models.map((model) => (
              <li
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className="px-4 py-2 text-[#e5e5e5] hover:bg-[#2c2c2e] cursor-pointer"
              >
                {model.name ?? model.id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}