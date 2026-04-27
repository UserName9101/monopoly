import { IGameEngine, TurnResult } from "./types";

export class MegaEngine implements IGameEngine {
  mode: "CLASSIC" | "MEGA" = "MEGA";
  private readonly BOARD_SIZE = 52;
  private readonly START_CELL = 0;
  private readonly PASS_BONUS = 200;
  private readonly LAND_BONUS = 100;

  calculateMove(currentPosition: number, diceSum: number): TurnResult {
    let newPosition = currentPosition + diceSum;
    let moneyChange = 0;
    let message = "";
    if (newPosition >= this.BOARD_SIZE) {
      newPosition = newPosition % this.BOARD_SIZE;
      moneyChange += this.PASS_BONUS;
      message += `Passed Start! +$${this.PASS_BONUS}. `;
    }
    if (newPosition === this.START_CELL && diceSum > 0) {
      moneyChange += this.LAND_BONUS;
      message += `Landed on Start! +$${this.LAND_BONUS}.`;
    }
    return {
      newPosition,
      moneyChange,
      message: message.trim()
    };
  }
}