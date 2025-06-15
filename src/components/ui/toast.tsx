import * as React from "react"
import {
  Toast as RadixToast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "@radix-ui/react-toast"
import { cn } from "../../lib/utils" // Utility function for class merging, replace or remove if unused
import { X } from "lucide-react"

const Toast = React.forwardRef<
  React.ElementRef<typeof RadixToast>,
  React.ComponentPropsWithoutRef<typeof RadixToast>
>(({ className, ...props }, ref) => (
  <RadixToast
    ref={ref}
    className={cn(
      "group pointer-events-auto relative flex w-full max-w-sm items-center space-x-4 overflow-hidden rounded-md border bg-background p-4 shadow-lg transition-all",
      className
    )}
    {...props}
  />
))
Toast.displayName = "Toast"

const ToastActionElement = ToastAction

const ToastWithSubcomponents = Object.assign(Toast, {
  Title: ToastTitle,
  Description: ToastDescription,
  Close: ToastClose,
  Action: ToastAction,
})

export {
  ToastProvider,
  ToastViewport,
  ToastWithSubcomponents as Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

// ✅ Export the required types for use-toast.ts
export type ToastProps = React.ComponentProps<typeof Toast>
export type ToastActionElement = React.ReactElement<typeof ToastAction>
