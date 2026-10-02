import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Escapa um valor para uma celula de CSV separado por ponto e virgula.
 *
 * Dois problemas resolvidos aqui:
 *  1. Quoting: uma descricao com ";", aspas ou quebra de linha empurrava as
 *     colunas seguintes para o lugar errado na planilha.
 *  2. CSV injection: Excel e Google Sheets executam a celula como formula
 *     quando ela comeca com = + - @ (ou tab/CR). Um titulo de produto
 *     comecando com "=" viraria formula na maquina de quem abrir o arquivo.
 *     O prefixo com apostrofo neutraliza sem alterar o texto exibido.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str = String(value)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }
  return `"${str.replace(/"/g, '""')}"`
}

/** Monta o conteudo de um CSV (`;` como separador, padrao pt-BR do Excel). */
export function toCSV(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(csvCell).join(';'),
    ...rows.map(row => row.map(csvCell).join(';')),
  ].join('\r\n')
}

/** Baixa um CSV client-side. BOM na frente para o Excel ler os acentos. */
export function downloadCSV(filename: string, headers: string[], rows: unknown[][]): void {
  const blob = new Blob(['﻿' + toCSV(headers, rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Escapa texto que sera interpolado em HTML (janela de impressao de relatorio).
 * Sem isto, uma descricao de lancamento com `<img onerror=...>` executa script
 * na janela aberta pelo painel.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Nome de arquivo seguro (sem separador de caminho nem caractere invalido). */
export function safeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-')
}
