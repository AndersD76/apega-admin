import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="text-3xl font-bold">Item não encontrado</h2>
      <p className="mt-4 text-neutral-600">
        Este anúncio não existe ou já foi removido.
      </p>
      <Link href="/" className="mt-6">
        <Button>Voltar para o início</Button>
      </Link>
    </div>
  );
}
