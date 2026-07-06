import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, style, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: "#0F172A",
      lineHeight: 1,
      ...style,
    }}
    className={className}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
