import * as React from "react"
import { cn } from "@/lib/utils"

function Table({ className, style, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      style={{ position: "relative", width: "100%", overflowX: "auto" }}
    >
      <table
        data-slot="table"
        style={{
          width: "100%",
          captionSide: "bottom",
          fontSize: "13.5px",
          borderCollapse: "collapse",
          ...style,
        }}
        className={cn("", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, style, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      style={{
        borderBottom: "2px solid #E2E8F0",
        background: "#F8FAFC",
        ...style,
      }}
      className={cn("", className)}
      {...props}
    />
  )
}

function TableBody({ className, style, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      style={style}
      className={cn("", className)}
      {...props}
    />
  )
}

function TableFooter({ className, style, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      style={{
        borderTop: "1px solid #E2E8F0",
        background: "#F1F5F9",
        fontWeight: 500,
        ...style,
      }}
      className={cn("", className)}
      {...props}
    />
  )
}

function TableRow({ className, style, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      style={{
        borderBottom: "1px solid #E2E8F0",
        transition: "background-color 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => { (e.currentTarget.style.backgroundColor = "#F8FAFC"); }}
      onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = "transparent"); }}
      className={cn("", className)}
      {...props}
    />
  )
}

function TableHead({ className, style, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      style={{
        height: 40,
        padding: "0 16px",
        textAlign: "left",
        verticalAlign: "middle",
        fontWeight: 600,
        color: "#64748B",
        whiteSpace: "nowrap",
        fontSize: "12.5px",
        ...style,
      }}
      className={cn("", className)}
      {...props}
    />
  )
}

function TableCell({ className, style, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      style={{
        padding: "12px 16px",
        verticalAlign: "middle",
        color: "#334155",
        ...style,
      }}
      className={cn("", className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  style,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      style={{
        marginTop: 16,
        fontSize: 14,
        color: "#64748B",
        ...style,
      }}
      className={cn("", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
