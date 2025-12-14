import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ItemCard } from "@/components/ItemCard";
import type { Item } from "@/types";

async function getItems(): Promise<Item[]> {
  try {
    const itemsRef = collection(db, "items");
    const q = query(
      itemsRef,
      where("status", "==", "AVAILABLE"),
      orderBy("createdAt", "desc"),
      limit(24)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Item;
    });
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    return [];
  }
}

export default async function HomePage() {
  const items = await getItems();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Peças únicas de brechó
        </h2>
        <p className="mt-2 text-neutral-600">
          Moda sustentável e acessível em{" "}
          {process.env.NEXT_PUBLIC_APP_CITY || "sua cidade"}
        </p>
      </div>

      {/* Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-neutral-600">
            Nenhuma peça disponível no momento.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Seja o primeiro a vender!
          </p>
        </div>
      )}
    </div>
  );
}
