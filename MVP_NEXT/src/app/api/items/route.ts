import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { Item, Seller } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extrair dados do vendedor
    const sellerName = formData.get("sellerName") as string;
    const sellerWhats = formData.get("sellerWhats") as string;

    // Extrair dados do item
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const brand = formData.get("brand") as string || "";
    const size = formData.get("size") as string || "";
    const priceCents = parseInt(formData.get("priceCents") as string, 10);
    const imageUrl = formData.get("imageUrl") as string;
    const condition = formData.get("condition") as string || "usado";
    const city = formData.get("city") as string || process.env.NEXT_PUBLIC_APP_CITY || "Passo Fundo";

    // Validações
    if (!sellerName || !sellerWhats || !title || !imageUrl || !priceCents) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Buscar ou criar vendedor
    const sellersRef = adminDb.collection("sellers");
    const sellerQuery = await sellersRef.where("whatsapp", "==", sellerWhats).get();

    let sellerId: string;

    if (sellerQuery.empty) {
      // Criar novo vendedor
      const newSellerRef = await sellersRef.add({
        name: sellerName,
        whatsapp: sellerWhats,
        createdAt: new Date(),
      });
      sellerId = newSellerRef.id;
    } else {
      // Atualizar vendedor existente
      const existingSeller = sellerQuery.docs[0];
      sellerId = existingSeller.id;
      await sellersRef.doc(sellerId).update({
        name: sellerName, // atualiza nome se mudou
      });
    }

    // Criar item
    const itemsRef = adminDb.collection("items");
    const newItem = await itemsRef.add({
      title,
      description,
      brand,
      size,
      priceCents,
      imageUrl,
      condition,
      city,
      sellerId,
      status: "AVAILABLE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      itemId: newItem.id,
    });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return NextResponse.json(
      { error: "Erro ao criar anúncio" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit") || "24";

    const itemsRef = adminDb.collection("items");
    const snapshot = await itemsRef
      .where("status", "==", "AVAILABLE")
      .orderBy("createdAt", "desc")
      .limit(parseInt(limitParam, 10))
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Erro ao buscar items:", error);
    return NextResponse.json(
      { error: "Erro ao buscar itens" },
      { status: 500 }
    );
  }
}
