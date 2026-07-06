import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        style={{
          display: "flex",
          height: 40,
          width: "100%",
          borderRadius: 8,
          border: "1px solid #E2E8F0",
          background: "white",
          padding: "0 12px",
          fontSize: 13.5,
          color: "#0F172A",
          transition: "border-color 0.15s, box-shadow 0.15s",
          outline: "none",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#38BDF8";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#E2E8F0";
          e.currentTarget.style.boxShadow = "none";
        }}
        className={className}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
