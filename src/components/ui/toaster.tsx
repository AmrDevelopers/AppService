import * as React from "react"
import { Toast, ToastProvider, ToastViewport } from "./toast"
import { useToast } from "./use-toast"


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <Toast.Title>{title}</Toast.Title>}
              {description && (
                <Toast.Description>{description}</Toast.Description>
              )}
            </div>
            {action}
            <Toast.Close />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}