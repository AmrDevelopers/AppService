import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, required, readOnly, ...props }, ref) => {
    return (
      <input
        type={type}
        className={className}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
