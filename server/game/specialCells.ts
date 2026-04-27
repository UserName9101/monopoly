import { Server } from "socket.io";
import { Room } from "./types";
import { calculateRent } from "./boardLogic";
import { drawCard, getCard } from "./cards";

export function handleSpecialCellEffects(room: Room, io: Server): "PAY" | "JAIL" | "NONE" {
    const gs = room.gameState;
    const curr = gs.players[gs.currentPlayerIndex];
    if (!curr || curr.isBankrupt) return "NONE";

    const cell = room.board[curr.position];
    const pName = room.players.find(p => p.userId === curr.userId)?.displayName || 'Игрок';
    const log = (text: string) => io.to(room.id).emit("game_log", { text, isSystem: true });

    const BOARD_LEN = room.board.length;
    const PASS_GO_BONUS = 200;

    // ====================== GO TO JAIL ======================
    // Прямая клетка "Иди в тюрьму" или карта, отправляющая в тюрьму
    if (
        (cell.type === "SPECIAL" && cell.action === "goToJail") ||
        ((cell.type === "CHANCE" || cell.type === "CHEST") && 
         /* будет обработано ниже в switch, но дублируем для надёжности */
         false) // оставлено для ясности структуры
    ) {
        // Принудительно отменяем все pending second moves (MR и BUS extra)
        gs.pendingMrEffect = false;
        gs.pendingBusExtraMove = false;

        curr.position = 13;
        curr.inJail = true;
        curr.jailTurns = 0;

        log(`${pName} отправляется в тюрьму!`);

        return "JAIL";
    }

    // ====================== INCOME TAX ======================
    if (cell.type === "TAX") {
        const amount = cell.price || 200;
        if (curr.money >= amount) {
            curr.money -= amount;
            log(`${pName} уплатил налог (-$${amount})`);
        } else {
            gs.activeAction = { type: "PAY", data: { amount, targetUserId: undefined } };
            log(`${pName} не может уплатить налог (-$${amount}). Необходимо продать имущество или заключить сделку.`);
            return "PAY";
        }
        return "NONE";
    }

    // ====================== BANK DEPOSIT ======================
    if (cell.type === "SPECIAL" && cell.action === "bankDeposit") {
        const amount = 100;
        if (curr.money >= amount) {
            curr.money -= amount;
            log(`${pName} внес банковский депозит (-$${amount})`);
        } else {
            gs.activeAction = { type: "PAY", data: { amount, targetUserId: undefined } };
            log(`${pName} не может внести депозит (-$${amount}). Необходимо продать имущество или заключить сделку.`);
            return "PAY";
        }
        return "NONE";
    }

    // ====================== AUCTION CELL ======================
    if (cell.type === "SPECIAL" && cell.action === "auction") {
        const unowned = room.board.filter(c =>
            ["PROPERTY", "STATION", "UTILITY"].includes(c.type) &&
            !c.ownerId &&
            !c.isMortgaged
        );

        if (unowned.length > 0) {
            gs.activeAction = { type: "CHOOSE_AUCTION" };
            log(`${pName} попал на Аукцион! Выберите собственность для торгов.`);
        } else {
            // Ищем собственность с максимальной рентой
            const opponents = room.board.filter(c =>
                ["PROPERTY", "STATION", "UTILITY"].includes(c.type) &&
                c.ownerId &&
                c.ownerId !== curr.userId &&
                !c.isMortgaged
            );

            if (opponents.length > 0) {
                let bestProp: any = null;
                let maxRent = -1;
                let minDist = Infinity;

                for (const prop of opponents) {
                    const rent = calculateRent(prop, room.board, gs.effectiveDiceSum ?? 7);
                    const dist = (prop.position - curr.position + BOARD_LEN) % BOARD_LEN;

                    if (rent > maxRent || (rent === maxRent && dist < minDist)) {
                        maxRent = rent;
                        bestProp = prop;
                        minDist = dist;
                    }
                }

                if (bestProp && maxRent > 0) {
                    curr.position = bestProp.position;
                    log(`${pName} перемещён на ${bestProp.name} (макс. рента $${maxRent}).`);

                    if (curr.money >= maxRent) {
                        curr.money -= maxRent;
                        const owner = room.gameState.players.find(p => p.userId === bestProp.ownerId);
                        if (owner) owner.money += maxRent;
                        log(`Рента $${maxRent} уплачена.`);
                    } else {
                        gs.activeAction = { type: "PAY", data: { amount: maxRent, targetUserId: bestProp.ownerId } };
                        log(`${pName} не может уплатить ренту $${maxRent}. Необходимо продать имущество или заключить сделку.`);
                        return "PAY";
                    }
                }
            } else {
                log(`${pName} попал на Аукцион, но все объекты уже принадлежат игрокам. Ничего не происходит.`);
            }
        }
        return "NONE";
    }

    // ====================== BUS TICKET CELL ======================
    if (cell.type === "SPECIAL" && cell.action === "busTicket") {
        if (room.busTicketsDeck > 0) {
            curr.busTickets = (curr.busTickets || 0) + 1;
            room.busTicketsDeck--;
            log(`${pName} вытянул билет на автобус! (Осталось в колоде: ${room.busTicketsDeck})`);
        } else {
            log(`${pName} попал на Билет на автобус, но колода пуста. Место работает как бесплатная парковка.`);
        }
        return "NONE";
    }

    // ====================== BIRTHDAY GIFT ======================
    if (cell.type === "SPECIAL" && cell.action === "birthdayGift") {
        gs.activeAction = { type: "CHOOSE_BIRTHDAY", data: { ticketsAvailable: room.busTicketsDeck > 0 } };
        log(`${pName} попал на Подарок на день рождения! Выберите награду.`);
        return "NONE";
    }

    // ====================== CHANCE / COMMUNITY CHEST ======================
    if (cell.type === "CHANCE" || cell.type === "CHEST") {
        const deckType = cell.type === "CHANCE" ? "chance" : "chest";
        const drawResult = drawCard(deckType, room.cardDeck);

        if (!drawResult) {
            log(`${pName} вытянул карту, но колода пуста.`);
            return "NONE";
        }

        const card = getCard(deckType, drawResult.cardId);
        if (!card) {
            log(`${pName} вытянул карту, но она не найдена.`);
            return "NONE";
        }

        if (drawResult.reshuffled) {
            log(`🃏 ${pName} вытянул: "${card.text}" (колода перемешана)`);
        } else {
            log(`🃏 ${pName} вытянул: "${card.text}"`);
        }

        switch (card.action) {
            case 'collect_money':
                if (card.amount) {
                    curr.money += card.amount;
                    log(`${pName} получил $${card.amount} по условиям карты.`);
                }
                break;

            case 'pay_money':
                if (card.amount) {
                    if (curr.money >= card.amount) {
                        curr.money -= card.amount;
                        log(`${pName} заплатил $${card.amount}.`);
                    } else {
                        gs.activeAction = { type: "PAY", data: { amount: card.amount, targetUserId: undefined } };
                        log(`${pName} не может заплатить $${card.amount}. Необходимо продать имущество или заключить сделку.`);
                        return "PAY";
                    }
                }
                break;

            case 'move_to':
                if (card.targetPosition !== undefined) {
                    const oldPos = curr.position;
                    if (card.moveDirection !== 'backward' && card.targetPosition < oldPos) {
                        curr.money += PASS_GO_BONUS;
                        log(`${pName} прошёл через СТАРТ и получил $${PASS_GO_BONUS}.`);
                    }
                    curr.position = card.targetPosition;
                    log(`${pName} перемещён на позицию ${curr.position} (${room.board[curr.position].name}).`);

                    if (card.amount) {
                        curr.money += card.amount;
                        log(`${pName} получил $${card.amount} по условиям карты.`);
                    }
                } else if (card.moveDirection === 'backward' && card.moveSteps) {
                    curr.position = (curr.position - card.moveSteps + BOARD_LEN) % BOARD_LEN;
                    log(`${pName} отступил на ${card.moveSteps} клетки назад.`);
                }
                break;

            case 'move_to_nearest':
                if (card.targetType === 'UTILITY' || card.targetType === 'RAILROAD') {
                    const searchType = card.targetType === 'RAILROAD' ? 'STATION' : 'UTILITY';
                    let foundPos = -1;
                    for (let i = 1; i < BOARD_LEN; i++) {
                        const pos = (curr.position + i) % BOARD_LEN;
                        if (room.board[pos].type === searchType) {
                            foundPos = pos;
                            break;
                        }
                    }
                    if (foundPos !== -1) {
                        const oldPos = curr.position;
                        if (foundPos < oldPos) {
                            curr.money += PASS_GO_BONUS;
                            log(`${pName} прошёл через СТАРТ и получил $${PASS_GO_BONUS}.`);
                        }
                        curr.position = foundPos;
                        log(`${pName} перемещён на ближайшую ${searchType === 'STATION' ? 'Ж/Д станцию' : 'Коммуналку'}.`);

                        const targetCell = room.board[foundPos];
                        if (targetCell.ownerId && targetCell.ownerId !== curr.userId) {
                            let rent = 0;
                            if (searchType === 'STATION') {
                                const rents = [25, 50, 100, 200];
                                const count = room.board.filter(x => x.group === 'station' && x.ownerId === targetCell.ownerId && !x.isMortgaged).length;
                                rent = (rents[Math.min(count, 4) - 1] ?? 0) * 2;
                            } else {
                                rent = 10 * (gs.effectiveDiceSum ?? 7);
                            }

                            if (curr.money >= rent) {
                                curr.money -= rent;
                                const owner = room.gameState.players.find(p => p.userId === targetCell.ownerId);
                                if (owner) owner.money += rent;
                                log(`${pName} уплатил ренту $${rent} владельцу.`);
                            } else {
                                gs.activeAction = { type: "PAY", data: { amount: rent, targetUserId: targetCell.ownerId } };
                                log(`${pName} не может уплатить ренту $${rent}. Необходимо продать имущество или заключить сделку.`);
                                return "PAY";
                            }
                        }
                    }
                }
                break;

            case 'go_to_jail':
                // Критически важно: отменяем pending MR и BUS Extra Move
                gs.pendingMrEffect = false;
                gs.pendingBusExtraMove = false;

                curr.position = 13;
                curr.inJail = true;
                curr.jailTurns = 0;
                log(`${pName} отправляется в тюрьму!`);
                return "JAIL";

            case 'get_out_of_jail':
                log(`${pName} получил карту "Выход из тюрьмы".`);
                break;

            case 'pay_each':
                if (card.amount) {
                    const otherPlayers = room.gameState.players.filter(p => p.userId !== curr.userId && !p.isBankrupt);
                    const total = card.amount * otherPlayers.length;
                    if (curr.money >= total) {
                        curr.money -= total;
                        for (const p of otherPlayers) {
                            p.money += card.amount!;
                        }
                        log(`${pName} заплатил $${card.amount} каждому игроку (всего $${total}).`);
                    } else {
                        gs.activeAction = { type: "PAY", data: { amount: total, targetUserId: undefined } };
                        log(`${pName} не может заплатить $${total}. Необходимо продать имущество или заключить сделку.`);
                        return "PAY";
                    }
                }
                break;

            case 'collect_from_each':
                if (card.amount) {
                    const otherPlayers = room.gameState.players.filter(p => p.userId !== curr.userId && !p.isBankrupt);
                    const total = card.amount * otherPlayers.length;
                    for (const p of otherPlayers) {
                        if (p.money >= card.amount!) {
                            p.money -= card.amount!;
                            curr.money += card.amount!;
                        }
                    }
                    log(`${pName} получил $${card.amount} от каждого игрока (всего $${total}).`);
                }
                break;

            case 'repair_properties':
                if (card.perHouse || card.perHotel) {
                    const myProps = room.board.filter(c => c.ownerId === curr.userId && (c.type === 'PROPERTY' || c.type === 'STATION'));
                    const houses = myProps.reduce((sum, c) => sum + (c.houses || 0), 0);
                    const hotels = myProps.filter(c => (c.houses || 0) === 5).length; // обычно 5 = отель
                    const cost = (houses * (card.perHouse || 0)) + (hotels * (card.perHotel || 0));

                    if (cost > 0) {
                        if (curr.money >= cost) {
                            curr.money -= cost;
                            log(`${pName} заплатил $${cost} за ремонт (${houses} домов × $${card.perHouse}, ${hotels} отелей × $${card.perHotel}).`);
                        } else {
                            gs.activeAction = { type: "PAY", data: { amount: cost, targetUserId: undefined } };
                            log(`${pName} не может заплатить $${cost} за ремонт. Необходимо продать имущество или заключить сделку.`);
                            return "PAY";
                        }
                    }
                }
                break;

            case 'nothing':
            default:
                log(`Никакого эффекта.`);
                break;
        }
        return "NONE";
    }

    // ====================== FALLBACK ======================
    return "NONE";
}