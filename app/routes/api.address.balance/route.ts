import { ActionFunction, json } from "@remix-run/node";
import { networks } from "bitcoinjs-lib";
import { z } from "zod";

import { formatAddressRuneBalance } from "@/lib/apis";
import { getAddressInscriptions } from "@/lib/apis/unisat/api";
import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { ValidAddressRuneAsset } from "@/lib/types/rune";
import { errorResponse } from "@/lib/utils/error-helpers";

const RequestSchema = z.object({
  address: z.string().min(1),
  network: z.enum(["bitcoin", "testnet"]),
});

type RequestSchemaType = z.infer<typeof RequestSchema>;

export const action: ActionFunction = async ({ request }) => {
  try {
    const data: RequestSchemaType = await request.json();

    try {
      RequestSchema.parse(data);
    } catch (e) {
      return json(errorResponse(10001));
    }

    const cache = await RedisInstance.get(`address:balance:${data.address}`);

    if (cache) {
      return json({
        code: 0,
        error: false,
        data: JSON.parse(cache),
      });
    }

    const network =
      data.network === "bitcoin" ? networks.bitcoin : networks.testnet;

    const runes = await formatAddressRuneBalance(
      data.address,
      network,
      "unisat",
    );

    const nftItems = await DatabaseInstance.rune_collection_item.findMany({
      select: {
        rune_spaced_name: true,
        etch_tx_hash: true,
      },
      where: {
        valid: 1,
        rune_spaced_name: {
          in: runes.map((rune) => rune.spacedRune),
        },
      },
    });

    const inscriptions = await getAddressInscriptions(network, data.address);

    const validRunes: ValidAddressRuneAsset[] = runes.map((item) => {
      const nftMatch = nftItems.find(
        (nft) => nft.rune_spaced_name === item.spacedRune,
      );

      if (nftMatch) {
        const inscription = inscriptions.find(
          (insc) => insc.inscriptionId.split("i")[0] === nftMatch.etch_tx_hash,
        );

        if (inscription) {
          return {
            ...item,
            type: "nft",
            inscription: {
              inscriptionId: inscription.inscriptionId,
              txid: inscription.utxo.txid,
              vout: inscription.utxo.vout,
              value: inscription.utxo.satoshi,
            },
          };
        } else {
          return {
            ...item,
            type: "token",
          };
        }
      } else {
        return {
          ...item,
          type: "token",
        };
      }
    });

    RedisInstance.set(
      `address:balance:${data.address}`,
      JSON.stringify(validRunes),
      "EX",
      60 * 1,
      "NX",
    );

    return json({
      code: 0,
      error: false,
      data: validRunes,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};
