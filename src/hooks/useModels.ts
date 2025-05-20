import { useEffect, useState } from "react";
import { Model } from "../models/chat";
import { getConfig } from "../config";

export function useModels() {
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    const config = getConfig();
    const client = config.client;

    if (config?.models?.length > 0) {
      setModels(config.models);
      return;
    }

    const loadModels = async () => {
      try {
        const models = await client.listModels();
        setModels(models);
      } catch (error) {
        console.error("error loading models", error);
      }
    };

    loadModels();
  }, []);

  return { models };
}
