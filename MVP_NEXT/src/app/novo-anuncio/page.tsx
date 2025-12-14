"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovoAnuncioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao criar anúncio");
      }
    } catch (err) {
      setError("Erro ao criar anúncio. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Novo Anúncio</h1>
        <p className="mt-2 text-neutral-600">
          Preencha os dados da peça que você quer vender
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Anúncio</CardTitle>
          <CardDescription>
            Quanto mais detalhes, mais fácil vender!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Dados do Vendedor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seus Dados</h3>

              <div className="space-y-2">
                <Label htmlFor="sellerName">
                  Seu nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sellerName"
                  name="sellerName"
                  required
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerWhats">
                  Seu WhatsApp <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sellerWhats"
                  name="sellerWhats"
                  required
                  placeholder="Ex: 54999999999 (com DDD, sem espaços)"
                  pattern="[0-9]{10,11}"
                />
                <p className="text-xs text-neutral-500">
                  Apenas números, com DDD. Ex: 54999999999
                </p>
              </div>
            </div>

            {/* Dados da Peça */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Dados da Peça</h3>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Título <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Ex: Vestido floral midi"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  placeholder="Descreva a peça: estado, detalhes, motivo da venda..."
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="Ex: Zara, Farm, etc"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Tamanho</Label>
                  <Input
                    id="size"
                    name="size"
                    placeholder="Ex: M, 38, G, etc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceCents">
                    Preço <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500">
                      R$
                    </span>
                    <Input
                      id="priceCents"
                      name="priceCents"
                      type="number"
                      required
                      placeholder="0"
                      min="100"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Em centavos. Ex: 8900 = R$ 89,00
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condição</Label>
                  <Select id="condition" name="condition" defaultValue="usado">
                    <option value="novo">Novo (com etiqueta)</option>
                    <option value="semi-novo">Semi-novo</option>
                    <option value="usado">Usado</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">
                  URL da Foto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  required
                  placeholder="https://..."
                />
                <p className="text-xs text-neutral-500">
                  Cole o link de uma foto hospedada online (Unsplash, Imgur,
                  etc)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={process.env.NEXT_PUBLIC_APP_CITY || ""}
                  placeholder="Ex: Passo Fundo"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Publicando..." : "Publicar Anúncio"}
            </Button>

            <p className="text-center text-xs text-neutral-500">
              Ao publicar, você concorda que as informações são verdadeiras e a
              peça está disponível para venda.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
