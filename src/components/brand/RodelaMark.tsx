/* Rodela — brand mark (símbolo oficial: arco tomate + ponto separado acima à direita) */
interface RodelaMarkProps {
  className?: string
  /** cor do arco; padrão: tomate */
  arc?: string
  /** cor do ponto; padrão: mesmo do arco */
  dot?: string
}

/**
 * Símbolo oficial da Rodela (referência da marca): um arco grosso na cor
 * tomate #FF4D2E, aberto para cima (tipo sorriso/rodela), levemente inclinado
 * — ponta esquerda mais alta que a direita — com um PONTO circular SEPARADO
 * acima à direita (nunca encostado no arco).
 * Cores fixas da marca, não herdadas do tema.
 */
export function RodelaMark({ className, arc, dot }: RodelaMarkProps) {
  const arcColor = arc ?? '#FF4D2E'
  const dotColor = dot ?? arcColor
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* arco: sorriso aberto para cima, inclinado (esquerda mais alta) */}
      <path
        d="M8 20.5 A 16.5 16.5 0 0 0 39 26.5"
        stroke={arcColor}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* ponto: círculo cheio SEPARADO, acima à direita do arco */}
      <circle cx="39.5" cy="10" r="6" fill={dotColor} />
    </svg>
  )
}

/**
 * Ícone do app / favicon: a marca (arco + ponto em tomate) sobre
 * quadrado creme arredondado — como na referência oficial.
 */
export function RodelaAppIcon({ className }: { className?: string }) {
  return (
    <div
      className={'flex items-center justify-center rounded-[22%] bg-creme ' + (className ?? '')}
      aria-hidden="true"
    >
      <RodelaMark className="w-[78%] h-[78%]" />
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
  const arc = invert ? 'var(--creme, #F7F2E8)' : undefined
  const dot = invert ? 'var(--creme, #F7F2E8)' : undefined
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
