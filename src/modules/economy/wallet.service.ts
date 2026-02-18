import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Wallet } from "./schema/wallet.schema";

@Injectable()
export class WalletService {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<Wallet>) {}

  async getWallet(characterId: string) {
    let wallet = await this.walletModel.findOne({ characterId });
    if (!wallet) {
      wallet = await this.walletModel.create({ characterId, coins: 0 });
    }
    return wallet;
  }
}