import { Bridge } from "./lib/bridge";
import { Client } from "./lib/client";
import { Model } from "./models/chat";

interface Config {
  title: string;

  client: Client;
  bridge: Bridge;

  models: Model[];

  modelsFilter: string[];
}

let config: Config;

export const loadConfig = async (): Promise<Config | undefined> => {
  try {
    const resp = await fetch("/config.json");

    if (!resp.ok) {
      throw new Error(`failed to load config.json: ${resp.statusText}`);
    }

    config = await resp.json();

    const client = new Client();
    const bridge = await Bridge.create("http://localhost:4200");

    config.client = client;
    config.bridge = bridge;

    return config;

  } catch (error) {
    console.error("unable to load config", error);
  }
};

export const getConfig = (): Config => {
  if (!config) {
    throw new Error("config not loaded");
  }

  return config;
};
