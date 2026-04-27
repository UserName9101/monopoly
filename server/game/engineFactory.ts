// server/game/engineFactory.ts
import { IGameEngine } from "./types";
import { MegaEngine } from "./megaEngine";
import { ClassicEngine } from "./classicEngine";

export function createEngine(mode: "CLASSIC" | "MEGA"): IGameEngine {
  switch (mode) {
    case "MEGA":
      return new MegaEngine();
    case "CLASSIC":
    default:
      return new ClassicEngine();
  }
}