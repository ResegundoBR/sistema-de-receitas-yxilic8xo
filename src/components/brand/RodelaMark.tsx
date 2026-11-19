/* Rodela — brand mark (símbolo: arco de círculo + ponto, "a rodela") */
interface RodelaMarkProps {
  className?: string
  /** cor do arco; padrão: tomate */
  arc?: string
  /** cor do ponto; padrão: mesmo do arco */
  dot?: string
}

/**
 * Símbolo da Rodela: um arco (segmento de círculo) com um ponto solto,
 * como uma fatia saindo do círculo. Herda a cor atual via `currentColor`
 * quando nenhuma cor é passada.
 */
export function RodelaMark({ className, arc, dot }: RodelaMarkProps) {
  const arcColor = arc ?? 'var(--tomate, #FF4D2E)'
  const dotColor = dot ?? arcColor
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* arco: segmento de círculo (a "rodela") */}
      <path d="M8 6 A22 22 0 0 1 30 40 L30 22 A12 12 0 0 0 22 10 Z" fill={arcColor} />
      {/* ponto */}
      <circle cx="37" cy="11" r="6" fill={dotColor} />
    </svg>
  )
}

/**
 * Ícone do app / favicon: arco tomate + ponto creme sobre quadrado
 * espresso arredondado (como na referência da marca).
 */
export function RodelaAppIcon({ className }: { className?: string }) {
  return (
    <div
      className={'flex items-center justify-center rounded-[22%] bg-espresso ' + (className ?? '')}
      aria-hidden="true"
    >
      <RodelaMark
        className="w-[70%] h-[70%]"
        arc="var(--creme, #F7F2E8)"
        dot="var(--tomate, #FF4D2E)"
      />
    </div>
  )
}

/** Logo completo: símbolo + wordmark "Rodela" em Archivo Black */
export function RodelaLogo({
  className,
  markClassName,
  textClassName,
  invert = false,
}: {
  className?: string
  markClassName?: string
  textClassName?: string
  /** invertida: creme sobre espresso (fundo escuro) */
  invert?: boolean
}) {
  const arc = invert ? 'var(--creme, #F7F2E8)' : 'var(--tomate, #FF4D2E)'
  const dot = invert ? 'var(--creme, #F7F2E8)' : 'var(--tomate, #FF4D2E)'
  const text = invert ? 'text-creme' : 'text-espresso'
  return (
    <span className={'inline-flex items-center gap-2 ' + (className ?? '')}>
      <RodelaMark className={'h-8 w-8 ' + (markClassName ?? '')} arc={arc} dot={dot} />
      <span
        className={
          'font-display text-xl leading-none tracking-tight ' + text + ' ' + (textClassName ?? '')
        }
      >
        Rodela
      </span>
    </span>
  )
}
