import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface Period {
  from: string
  to: string
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

export function periodPreset(preset: 'hoje' | '7d' | '30d' | 'mes' | 'mes-passado' | '12m'): Period {
  const now = new Date()
  const to = iso(now)
  switch (preset) {
    case 'hoje':
      return { from: to, to }
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 6)
      return { from: iso(d), to }
    }
    case '30d': {
      const d = new Date(now); d.setDate(d.getDate() - 29)
      return { from: iso(d), to }
    }
    case 'mes': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: iso(d), to }
    }
    case 'mes-passado': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: iso(first), to: iso(last) }
    }
    case '12m': {
      const d = new Date(now); d.setFullYear(d.getFullYear() - 1)
      return { from: iso(d), to }
    }
  }
}

const PRESETS: { key: Parameters<typeof periodPreset>[0]; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'mes', label: 'Este mês' },
  { key: 'mes-passado', label: 'Mês passado' },
  { key: '12m', label: '12 meses' },
]

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period) => void
  className?: string
}

/**
 * Filtro de período padrão do admin: datas digitáveis + atalhos.
 * O onChange dispara a cada mudança — quem usa decide quando buscar.
 */
export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          className="h-9 w-[150px]"
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
        <span className="text-sm text-muted-foreground">até</span>
        <Input
          type="date"
          className="h-9 w-[150px]"
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => {
          const preset = periodPreset(p.key)
          const active = preset.from === value.from && preset.to === value.to
          return (
            <Button
              key={p.key}
              variant={active ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => onChange(preset)}
            >
              {p.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default PeriodFilter
