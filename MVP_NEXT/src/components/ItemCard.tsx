import Link from "next/link";
import Image from "next/image";
import { toBRL } from "@/lib/utils";
import type { Item } from "@/types";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const isAvailable = item.status === "AVAILABLE";

  return (
    <Link href={`/item/${item.id}`} className="group">
      <div className="overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Status Badge */}
          {!isAvailable && (
            <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
              {item.status === "RESERVED" ? "Reservado" : "Vendido"}
            </div>
          )}

          {/* Condition Badge */}
          {item.condition && (
            <div className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium capitalize">
              {item.condition}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="line-clamp-1 font-medium text-neutral-900">
            {item.title}
          </h3>

          <p className="mt-1 text-lg font-bold text-neutral-900">
            {toBRL(item.priceCents)}
          </p>

          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-600">
            {item.brand && <span>{item.brand}</span>}
            {item.brand && item.size && <span>•</span>}
            {item.size && <span>Tam. {item.size}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
