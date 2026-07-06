import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", style, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button"
    
    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      whiteSpace: "nowrap",
      borderRadius: 8,
      fontSize: 13.5,
      fontWeight: 600,
      transition: "all 0.15s",
      cursor: "pointer",
      border: "none",
      outline: "none",
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      default: { background: "#0F172A", color: "white" },
      destructive: { background: "#EF4444", color: "white" },
      outline: { background: "transparent", border: "1px solid #E2E8F0", color: "#0F172A" },
      secondary: { background: "#F1F5F9", color: "#0F172A" },
      ghost: { background: "transparent", color: "#0F172A" },
      link: { background: "transparent", color: "#0F172A", textDecoration: "underline" },
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      default: { height: 40, padding: "0 16px" },
      sm: { height: 32, padding: "0 12px", fontSize: 12.5 },
      lg: { height: 44, padding: "0 32px" },
      icon: { height: 40, width: 40, padding: 0 },
    };

    return (
      <Comp
        ref={ref as any}
        style={{ ...baseStyle, ...variantStyles[variant], ...sizeStyles[size], ...style }}
        onMouseEnter={(e: any) => {
          if (props.disabled) return;
          if (variant === "default") e.currentTarget.style.background = "#334155";
          if (variant === "destructive") e.currentTarget.style.background = "#DC2626";
          if (variant === "outline" || variant === "ghost") e.currentTarget.style.background = "#F8FAFC";
        }}
        onMouseLeave={(e: any) => {
          if (props.disabled) return;
          if (variant === "default") e.currentTarget.style.background = "#0F172A";
          if (variant === "destructive") e.currentTarget.style.background = "#EF4444";
          if (variant === "outline" || variant === "ghost") e.currentTarget.style.background = "transparent";
        }}
        className={className}
        disabled={props.disabled}
        {...(props as any)}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
