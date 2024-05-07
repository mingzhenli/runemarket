import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { networks } from "bitcoinjs-lib";
import { useMemo } from "react";

import { getInscriptionInfo, getRuneHolders } from "@/lib/apis/unisat/api";
import { UnisatInscriptionInfoType } from "@/lib/apis/unisat/type";
import RedisInstance from "@/lib/server/redis.server";
import { formatAddress, formatNumber } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import CopyButton from "@/components/CopyButton";
import { Progress } from "@/components/Progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Table";

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const cache = await RedisInstance.get(`rune:info:${id}`);

    if (cache) {
      return json({
        data: JSON.parse(cache),
      });
    }

    const rune = await getRuneInfo(networks.bitcoin, id);

    if (!rune) {
      return new Response("Not Found", { status: 404 });
    }

    const promiseArray: any[] = [getRuneHolders(networks.bitcoin, rune.id)];

    if (rune.inscription) {
      promiseArray.push(getInscriptionInfo(networks.bitcoin, rune.inscription));
    }

    const [runeHolders, inscription] = await Promise.all(promiseArray);

    const response: {
      rune: any;
      inscription?: UnisatInscriptionInfoType;
      runeHolders: {
        address: string;
        amount: string;
      }[];
    } = rune.inscription
      ? {
          rune,
          inscription,
          runeHolders,
        }
      : {
          rune,
          runeHolders,
        };

    RedisInstance.set(
      `rune:info:${id}`,
      JSON.stringify(response),
      "EX",
      60 * 3,
      "NX",
    );

    return json({
      data: response,
    });
  } catch (e) {
    console.log(e);

    return new Response("Not Found", { status: 404 });
  }
};

export default function RunePage() {
  const { data } = useLoaderData<{
    data: {
      rune: any;
      inscription?: UnisatInscriptionInfoType;
      runeHolders: {
        address: string;
        amount: string;
      }[];
    };
  }>();

  const mintProgress = useMemo(() => {
    if (data.rune.cap === 0 && data.rune.mints === 0) {
      return 100;
    }

    return (data.rune.mints / data.rune.cap) * 100;
  }, [data]);

  return (
    <div className="w-full space-y-6">
      <div className="flex w-full items-center space-x-4">
        <div className="aspect-square w-20 shrink-0 rounded-lg bg-secondary">
          <Avatar className="h-full w-full rounded-lg">
            <AvatarImage
              src={`https://ordinals.com/content/${data.rune.inscription}`}
            />
            <AvatarFallback>{data.rune.symbol}</AvatarFallback>
          </Avatar>
        </div>
        <div className="space-y-4">
          <div className="break-all text-2xl font-bold">{data.rune.name}</div>
          <div className="flex items-center space-x-2">
            <Progress
              className="w-60"
              value={100}
            />
            <div className="text-sm">
              {formatNumber(mintProgress, { precision: 2 })}%
            </div>
          </div>
        </div>
      </div>
      <div className="text-xl font-bold">Rune Data</div>
      <div className="flex w-full flex-wrap gap-4">
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Symbol</div>
          <div className="text-sm">{data.rune.symbol}</div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Rune Id</div>
          <div className="text-sm">{data.rune.id}</div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Rune Number</div>
          <div className="text-sm">{`# ${data.rune.number}`}</div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Divisibility</div>
          <div className="text-sm">{data.rune.divisibility}</div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Per Mint</div>
          <div className="text-sm">
            {formatNumber(parseInt(data.rune.amount))}
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Mint Start Block</div>
          <div className="text-sm">
            {data.rune.mint_start === 0
              ? "-"
              : formatNumber(data.rune.mint_start)}
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Mint End Block</div>
          <div className="text-sm">
            {data.rune.mint_end === 0 ? "-" : formatNumber(data.rune.mint_end)}
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Supply</div>
          <div className="text-sm">
            {formatNumber(parseInt(data.rune.supply))}
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Premine</div>
          <div className="text-sm">
            {formatNumber(parseInt(data.rune.premine))}
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Burned</div>
          <div className="text-sm">
            {formatNumber(parseInt(data.rune.burned))}
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Etching</div>
          <div className="flex items-center space-x-4">
            <a
              href={`https://mempool.space/tx/${data.rune.etching_tx_id}`}
              target="_blank"
              className="text-sm text-primary transition-colors hover:text-theme"
            >
              {formatAddress(data.rune.etching_tx_id, 12)}
            </a>
            <CopyButton text={data.rune.etching_tx_id} />
          </div>
        </div>
      </div>
      <div className="text-xl font-bold">Inscription Data</div>
      <div className="flex w-full flex-wrap gap-4">
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Inscription Id</div>
          <div className="flex items-center space-x-4">
            <a
              href={`https://ordinals.com/inscription/${data.rune.inscription}`}
              target="_blank"
              className="text-sm text-primary transition-colors hover:text-theme"
            >
              {data.inscription
                ? formatAddress(data.rune.inscription, 12)
                : "-"}
            </a>
            <CopyButton text={data.rune.inscription} />
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Inscription Number</div>
          <div className="text-sm">
            {data.inscription ? `# ${data.inscription.inscriptionNumber}` : "-"}
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Content Type</div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              {data.inscription ? data.inscription.contentType || "-" : "-"}
            </div>
          </div>
        </div>
        <div className="flex grow flex-col items-center justify-center space-y-2 overflow-hidden rounded-lg bg-secondary px-4 py-3">
          <div className="font-medium text-secondary">Owner</div>
          <div className="flex items-center space-x-4">
            <a
              href={`https://mempool.space/address/${data.inscription ? data.inscription.address : "-"}`}
              target="_blank"
              className="text-sm text-primary transition-colors hover:text-theme"
            >
              {data.inscription
                ? formatAddress(data.inscription.address, 6)
                : "-"}
            </a>
          </div>
        </div>
      </div>
      <div className="text-xl font-bold">Top 50 Rune Holders</div>
      <Table>
        <TableHeader>
          <TableRow className="relative bg-secondary">
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Address</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Balance</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Progress</div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.runeHolders.map((holder) => (
            <TableRow key={`${data.rune.id}:${holder.address}`}>
              <TableCell className="min-w-[250px]">
                <a
                  href={`https://mempool.space/address/${holder.address}`}
                  target="_blank"
                  className="text-primary transition-colors hover:text-theme"
                >
                  {formatAddress(holder.address, 6)}
                </a>
              </TableCell>
              <TableCell className="min-w-[250px]">
                {formatNumber(
                  parseInt(holder.amount) / 10 ** data.rune.divisibility,
                )}
              </TableCell>
              <TableCell className="min-w-[300px]">
                <div className="flex items-center space-x-4">
                  <Progress
                    className="h-2 w-60"
                    value={
                      (parseInt(holder.amount) /
                        10 ** data.rune.divisibility /
                        parseInt(data.rune.supply)) *
                      100
                    }
                  />
                  <div className="text-sm">
                    {`${formatNumber(
                      (parseInt(holder.amount) /
                        10 ** data.rune.divisibility /
                        parseInt(data.rune.supply)) *
                        100,
                      {
                        precision: 6,
                      },
                    )}%`}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
