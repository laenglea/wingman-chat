import { useEffect, useState } from "react";
import { Model } from "../models/chat";
import { getConfig } from "../config";
import { listModels } from "../lib/client";

export function useModels() {
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    const config = getConfig();

    if (config?.models?.length > 0) {
      let models = config.models

      if (config.modelsFilter) {
        models = models.filter((model) => config.modelsFilter.includes(model.id));
      }

      setModels(models);
      return;
    }

    const loadModels = async () => {
      try {
        let models = await listModels();

        if (config.modelsFilter) {
          models = models.filter((model) => config.modelsFilter.includes(model.id));
        }

        setModels(models);        
      } catch (error) {
        console.error("error loading models", error);
      }
    };

    loadModels();
  }, []);

  return { models };
}
