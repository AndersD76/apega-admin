import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const sellerDoc = await adminDb.collection("sellers").doc(id).get();

    if (!sellerDoc.exists) {
      return NextResponse.json(
        { error: "Vendedor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      seller: {
        id: sellerDoc.id,
        ...sellerDoc.data(),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar vendedor:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendedor" },
      { status: 500 }
    );
  }
}
