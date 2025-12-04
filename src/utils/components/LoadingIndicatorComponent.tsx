

interface LoadingIndicatorComponentProps{
    visible: boolean; 
    size?: number;
    color?: string
}

export const LoadingIndicatorComponent = ({visible, size = 24, color = '#3b82f6'}: LoadingIndicatorComponentProps) => {
if(!visible) return null 

  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) - 2}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${size * 0.6}, ${size * 0.4}`}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur="1s"
            from={`0 ${size / 2} ${size / 2}`}
            to={`360 ${size / 2} ${size / 2}`}
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <span className="loading-text">Cargando resultados...</span>
    </div>
  )
}
