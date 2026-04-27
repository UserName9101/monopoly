// server/game/classicEngine.ts
import { IGameEngine, TurnResult } from "./types";

export class ClassicEngine implements IGameEngine {
  mode: "CLASSIC" | "MEGA" = "CLASSIC";
  private readonly BOARD_SIZE = 40; 

  calculateMove(currentPosition: number, diceSum: number): TurnResult {
    let newPosition = currentPosition + diceSum;
    let moneyChange = 0;
    
    if (newPosition >= this.BOARD_SIZE) {
      newPosition = newPosition % this.BOARD_SIZE;
      moneyChange = 200; 
    }

    return {
      newPosition,
      moneyChange,
      message: "Classic move."
    };
  }
}