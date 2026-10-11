export default function Button({
    children,
    type = 'button',
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false
}) {
    const base = "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
        md: "px-4 py-2 text-sm rounded-lg gap-2",
        lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
    };

    const variants = {
        primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/20 active:scale-[0.98]",
        secondary: "bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/[0.08]",
        outline: "border border-gray-300 dark:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300",
        ghost: "hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
        danger: "bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-500/20 active:scale-[0.98]",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
        >
            {children}
        </button>
    );
}
