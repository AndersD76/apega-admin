import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toBRL, getWhatsAppLink, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Item, Seller } from "@/types";

async function getItem(id: string): Promise<(Item & { seller: Seller }) | null> {
  try {
    const itemDoc = await adminDb.collection("items").doc(id).get();

    if (!itemDoc.exists) {
      return null;
    }

    const itemData = itemDoc.data();
    if (!itemData) return null;

    // Buscar vendedor
    const sellerDoc = await adminDb
      .collection("sellers")
      .doc(itemData.sellerId)
      .get();

    const sellerData = sellerDoc.data();
    if (!sellerData) return null;

    return {
      id: itemDoc.id,
      ...itemData,
      createdAt: itemData.createdAt?.toDate() || new Date(),
      seller: {
        id: sellerDoc.id,
        ...sellerData,
        createdAt: sellerData.createdAt?.toDate() || new Date(),
      } as Seller,
    } as Item & { seller: Seller };
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return null;
  }
}

export default async function ItemPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await getItem(params.id);

  if (!item) {
    notFound();
  }

  const isAvailable = item.status === "AVAILABLE";

  const whatsappMessage = `Olá! Vi seu anúncio no Apega Desapega e tenho interesse em:\n\n${item.title}\n${toBRL(item.priceCents)}`;
  const whatsappLink = getWhatsAppLink(item.seller.whatsapp, whatsappMessage);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:text-neutral-900">
          Início
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-900">{item.title}</span>
      </nav>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Imagem */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 border">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {/* Status Badge */}
            {!isAvailable && (
              <div className="absolute left-4 top-4 rounded-lg bg-black/70 px-3 py-2 text-sm font-medium text-white backdrop-blur">
                {item.status === "RESERVED" ? "Reservado" : "Vendido"}
              </div>
            )}
          </div>

          {/* Info adicional */}
          <div className="rounded-lg border bg-neutral-50 p-4 text-sm">
            <p className="font-medium">💡 Dica</p>
            <p className="mt-1 text-neutral-600">
              Combine retirada pessoal em {item.city} ou combinem o envio
              diretamente com o vendedor.
            </p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="space-y-6">
          {/* Título e Preço */}
          <div>
            <h1 className="text-3xl font-bold lg:text-4xl">{item.title}</h1>
            <div className="mt-4">
              <p className="text-3xl font-bold text-neutral-900">
                {toBRL(item.priceCents)}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {item.condition && (
              <Badge variant="secondary" className="capitalize">
                {item.condition}
              </Badge>
            )}
            {item.brand && <Badge variant="outline">{item.brand}</Badge>}
            {item.size && <Badge variant="outline">Tam. {item.size}</Badge>}
          </div>

          {/* Descrição */}
          <div className="space-y-2 border-t pt-6">
            <h2 className="text-lg font-semibold">Descrição</h2>
            <p className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Vendedor */}
          <div className="space-y-3 border-t pt-6">
            <h2 className="text-lg font-semibold">Vendedor</h2>
            <div className="space-y-1">
              <p className="font-medium">{item.seller.name}</p>
              <p className="text-sm text-neutral-600">{item.city}</p>
              <p className="text-xs text-neutral-500">
                Anunciado em {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          {/* CTA - WhatsApp */}
          <div className="sticky bottom-0 space-y-3 border-t bg-white pt-6">
            {isAvailable ? (
              <>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Entrar em contato
                  </Button>
                </a>
                <p className="text-center text-xs text-neutral-500">
                  Você será redirecionado para o WhatsApp
                </p>
              </>
            ) : (
              <Button disabled className="w-full" size="lg">
                Item não disponível
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mais informações */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Sobre este anúncio</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-neutral-600">Condição</p>
            <p className="mt-1 capitalize">{item.condition || "Não informado"}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-neutral-600">Marca</p>
            <p className="mt-1">{item.brand || "Não informado"}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-neutral-600">Tamanho</p>
            <p className="mt-1">{item.size || "Não informado"}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-neutral-600">Localização</p>
            <p className="mt-1">{item.city}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-neutral-600">Status</p>
            <p className="mt-1 capitalize">
              {item.status === "AVAILABLE"
                ? "Disponível"
                : item.status === "RESERVED"
                ? "Reservado"
                : "Vendido"}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-neutral-600">Publicado em</p>
            <p className="mt-1">{formatDate(item.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
