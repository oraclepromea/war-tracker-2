// Basic Switch component
export function Switch({ checked, onCheckedChange, ...props }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  [key: string]: any;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-neon-400' : 'bg-tactical-border'
      }`}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// Basic Input component  
export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-tactical-border bg-tactical-panel px-3 py-2 text-sm text-tactical-text placeholder:text-tactical-muted focus:outline-none focus:ring-2 focus:ring-neon-400 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

// Basic Badge component
export function Badge({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
  [key: string]: any;
}) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  
  const variantClasses = {
    default: "bg-neon-400 text-black",
    secondary: "bg-tactical-panel text-tactical-text border border-tactical-border",
    outline: "border text-tactical-text"
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}