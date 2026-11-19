/* Rodela — brand mark (símbolo: arco + ponto, "a rodela") */
interface RodelaMarkProps {
  className?: string
  /** cor do arco; padrão: tomate */
  arc?: string
  /** cor do ponto; padrão: mesmo do arco */
  dot?: string
}

/**
 * Símbolo da Rodela: um arco (semicírculo) aberto para cima/direita
 * com um ponto (círculo cheio) sobreposto — ver referência visual da marca.
 * Cores fixas (tomate #FF4D2E) a pedido do usuário, não herdadas do tema.
 */
export function RodelaMark({ className, arc, dot }: RodelaMarkProps) {
  const arcColor = arc ?? '#FF4D2E'
  const dotColor = dot ?? arcColor
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* arco: semicírculo aberto para cima/direita */}
      <path
        d="M6 24 A 18 18 0 0 0 42 24"
        stroke={arcColor}
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      {/* ponto: círculo cheio sobreposto ao arco */}
      <circle cx="36" cy="9" r="7" fill={dotColor} />
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
