import * as React from "react";

const SelectContext = React.createContext<{
  value: any;
  onValueChange: (value: any) => void;
  closeDropdown: () => void;
} | null>(null);

const Select = ({ children, value, onValueChange, required }: any) => {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => setOpen(!open);
  const closeDropdown = () => setOpen(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, closeDropdown }}>
      <div data-value={value} data-required={required} style={{ position: "relative", width: "180px" }}>
        {/* Clicking trigger toggles dropdown */}
        <div onClick={toggleOpen} style={{ cursor: "pointer" }}>
          {React.Children.toArray(children).find(child => child.type.name === "SelectTrigger")}
        </div>
        {/* Show dropdown only if open */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              border: "1px solid #ccc",
              zIndex: 50,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {React.Children.toArray(children).find(child => child.type.name === "SelectContent")}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children }: any) => {
  return <div>{children}</div>;
};

const SelectValue = ({ placeholder, statusLabels = {} }: any) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;

  const label =
    ctx.value === "all"
      ? placeholder
      : statusLabels[ctx.value] || ctx.value || placeholder;

  return <span className="truncate">{label}</span>;
};

const SelectContent = ({ children }: any) => {
  return <div>{children}</div>;
};

const SelectItem = ({ value, children }: any) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;

  const isSelected = ctx.value === value;

  const handleClick = () => {
    ctx.onValueChange(value);
    ctx.closeDropdown(); // Close dropdown after selection
  };

  return (
    <div
      data-value={value}
      onClick={handleClick}
      style={{
        cursor: "pointer",
        backgroundColor: isSelected ? "#e2e8f0" : "transparent",
        padding: "4px 8px",
      }}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
