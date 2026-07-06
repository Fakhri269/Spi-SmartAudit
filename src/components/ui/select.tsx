"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

function SelectGroup({ className, style, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      style={{ padding: 4, ...style }}
      {...props}
    />
  )
}

function SelectValue({ className, style, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      style={{ display: "flex", flex: 1, textAlign: "left", ...style }}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  style,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        width: "100%",
        minHeight: size === "sm" ? 32 : 40,
        borderRadius: 8,
        border: "1px solid #E2E8F0",
        background: "white",
        padding: "0 12px",
        fontSize: 13.5,
        color: "#0F172A",
        outline: "none",
        cursor: "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon style={{ width: 16, height: 16, color: "#64748B", flexShrink: 0 }} />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  style,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        style={{ zIndex: 50 }}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          style={{
            zIndex: 50,
            width: "var(--anchor-width)",
            minWidth: 160,
            maxHeight: "50vh",
            overflowX: "hidden",
            overflowY: "auto",
            borderRadius: 8,
            background: "white",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: 4,
            ...style,
          }}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  style,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      style={{
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 600,
        color: "#64748B",
        ...style,
      }}
      {...props}
    />
  )
}

function SelectItem({
  className,
  style,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        cursor: "pointer",
        borderRadius: 6,
        padding: "8px 32px 8px 12px",
        fontSize: 13.5,
        outline: "none",
        color: "#0F172A",
        transition: "background 0.15s",
        ...style,
      }}
      onMouseEnter={(e: any) => { e.currentTarget.style.background = "#F1F5F9"; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; }}
      {...props}
    >
      <SelectPrimitive.ItemText style={{ flex: 1, whiteSpace: "nowrap" }}>
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span style={{ position: "absolute", right: 10, display: "flex", alignItems: "center", justifyContent: "center" }} />
        }
      >
        <CheckIcon style={{ width: 16, height: 16, color: "#0F172A" }} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  style,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      style={{
        margin: "4px -4px",
        height: 1,
        background: "#E2E8F0",
        ...style,
      }}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  style,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 4,
        cursor: "default",
        background: "white",
        ...style,
      }}
      {...props}
    >
      <ChevronUpIcon style={{ width: 14, height: 14 }} />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  style,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 4,
        cursor: "default",
        background: "white",
        ...style,
      }}
      {...props}
    >
      <ChevronDownIcon style={{ width: 14, height: 14 }} />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
