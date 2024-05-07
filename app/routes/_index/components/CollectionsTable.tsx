import { useNavigate } from "@remix-run/react";
import { useMemo } from "react";

import { useBTCPrice } from "@/lib/hooks/useBTCPrice";
import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { formatNumber, satsToBTC } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import Pagination from "@/components/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Table";

import { IndexPageCollectionResponseType } from "../types";

const CollectionsTable: React.FC<{
  collections: IndexPageCollectionResponseType[];
  page: number;
  filters: string;
}> = ({ collections, page, filters }) => {
  const navigate = useNavigate();
  const { updateSearchParams } = useSetSearch();
  const { BTCPrice } = useBTCPrice();

  const sortedCollections = useMemo(() => {
    const filterCollections = filters
      ? collections.filter((collection) =>
          collection.display_name.toLowerCase().includes(filters.toLowerCase()),
        )
      : collections;

    return filterCollections;
  }, [collections, filters]);

  const total = useMemo(
    () =>
      sortedCollections.length > 0
        ? Math.ceil(sortedCollections.length / 10)
        : 1,
    [sortedCollections],
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="relative bg-secondary">
            <TableHead>
              <div className="flex items-center space-x-2">
                <div className="text-nowrap">Name</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div className="text-nowrap">Floor Price</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div className="text-nowrap">Listings</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Items</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Sales(24H)</div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Volume(24H)</div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCollections
            .slice((page - 1) * 10, page * 10)
            .map((collection) => (
              <TableRow
                key={collection.name}
                className="group relative cursor-pointer"
                onClick={() =>
                  navigate(`/market/collections/${collection.name}/listings`)
                }
              >
                <TableCell className="min-w-[250px]">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-12 w-12 rounded-md">
                      <AvatarImage
                        src={collection.icon}
                        alt={collection.display_name}
                      />
                      <AvatarFallback className="rounded-md bg-secondary">
                        {collection.symbol}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-xs sm:text-sm lg:text-base">
                      {collection.display_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-base">
                      <img
                        src="/icons/btc.svg"
                        alt="btc"
                      />
                      <div>
                        {formatNumber(
                          parseFloat(
                            satsToBTC(parseFloat(collection.floor_price)),
                          ),
                          {
                            precision: 8,
                          },
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-secondary">
                      {BTCPrice
                        ? `$ ${formatNumber(
                            parseFloat(
                              satsToBTC(parseFloat(collection.floor_price)),
                            ) * BTCPrice,
                            { precision: 2 },
                          )}`
                        : "$ -"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="text-base">
                    {formatNumber(collection.listings)}
                  </div>
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="text-base">
                    {formatNumber(collection.items_count)}
                  </div>
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="text-base">
                    {formatNumber(collection.sales_24h)}
                  </div>
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="flex items-center space-x-2 text-base">
                    <img
                      src="/icons/btc.svg"
                      alt="btc"
                    />
                    <div>
                      {formatNumber(
                        parseFloat(
                          satsToBTC(parseFloat(collection.volume_24h), {
                            digits: 8,
                          }),
                        ),
                        {
                          precision: 6,
                        },
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        total={total}
        onPageChange={(page) =>
          updateSearchParams({ page }, { action: "push", scroll: false })
        }
      />
    </>
  );
};

export default CollectionsTable;
