import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Character } from "../character/schema/character.schema";
import { Wallet } from "../economy/schema/wallet.schema";

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Character.name) private characterModel: Model<Character>,
  ) {}

  async buyPreWorkout(characterId: string) {
    const cost = 500; // Precio del pre-entreno
    const wallet = await this.walletModel.findOne({ characterId });

    if (wallet.coins < cost) throw new Error('Fondos insuficientes en el Arca');

    // Descontar dinero
    wallet.coins -= cost;
    await wallet.save();

    // Aplicar efecto: Bajar fatiga actual
    // Podrías buscar los músculos del personaje y reducir su fatiga un 20%
    return { message: "Pre-entreno consumido: Fatiga reducida", newBalance: wallet.coins };
  }
}