import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const itemDoc = await adminDb.collection("items").doc(id).get();

    if (!itemDoc.exists) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    const itemData = itemDoc.data();

    // Buscar informações do vendedor
    const sellerDoc = await adminDb
      .collection("sellers")
      .doc(itemData?.sellerId)
      .get();

    const sellerData = sellerDoc.exists ? sellerDoc.data() : null;

    return NextResponse.json({
      success: true,
      item: {
        id: itemDoc.id,
        ...itemData,
      },
      seller: sellerData
        ? {
            id: sellerDoc.id,
            ...sellerData,
          }
        : null,
    });
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return NextResponse.json(
      { error: "Erro ao buscar item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const itemRef = adminDb.collection("items").doc(id);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar apenas campos permitidos
    const allowedFields = ["status", "title", "description", "priceCents", "condition"];
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await itemRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Item atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const itemRef = adminDb.collection("items").doc(id);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    await itemRef.delete();

    return NextResponse.json({
      success: true,
      message: "Item deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return NextResponse.json(
      { error: "Erro ao deletar item" },
      { status: 500 }
    );
  }
}
