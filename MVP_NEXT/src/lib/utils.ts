import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatação de dinheiro
export function toBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Formatação de WhatsApp
export function formatWhatsApp(phone: string): string {
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, "");

  // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  return phone;
}

// Gera link do WhatsApp
export function getWhatsAppLink(phone: string, message?: string): string {
  const numbers = phone.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/55${numbers}${text}`;
}

// Validar WhatsApp
export function isValidWhatsApp(phone: string): boolean {
  const numbers = phone.replace(/\D/g, "");
  return numbers.length === 10 || numbers.length === 11;
}

// Formatação de data
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Calcular comissão
export function calculateFees(priceCents: number) {
  const COMMISSION_RATE = Number(process.env.COMMISSION_RATE) || 5;
  const feeMarketplaceCents = Math.round(priceCents * (COMMISSION_RATE / 100));
  const netCents = priceCents - feeMarketplaceCents;

  return {
    grossCents: priceCents,
    feeMarketplaceCents,
    netCents,
    commissionRate: COMMISSION_RATE,
  };
}
