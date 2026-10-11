export default function Input({
    id,
    name,
    type = 'text',
    label,
    value,
    onChange,
    required = false,
    placeholder = '',
    error = '',
    helper = '',
    className = ''
}) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={id}
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-150 outline-none
                    bg-white dark:bg-[#1E293B]/60
                    text-gray-900 dark:text-gray-100
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    ${error
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-gray-200 dark:border-white/[0.08] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:focus:border-violet-400'
                    } ${className}`}
            />
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
            {helper && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{helper}</p>}
        </div>
    );
}
