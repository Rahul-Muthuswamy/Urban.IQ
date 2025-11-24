import { useState } from "react";
import { motion } from "framer-motion";

export default function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  helperText,
  required = false,
  rows = 1,
}) {
  const [focused, setFocused] = useState(false);

  const inputVariants = {
    unfocused: {
      scale: 1,
      boxShadow: "0 0 0 0px rgba(132, 204, 22, 0)",
    },
    focused: {
      scale: 1.01,
      boxShadow: "0 0 0 3px rgba(132, 204, 22, 0.2), 0 0 20px rgba(132, 204, 22, 0.3)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const InputComponent = type === "textarea" ? "textarea" : "input";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <label htmlFor={id} className="block text-sm md:text-base font-medium text-gray-700">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>

      <motion.div
        variants={inputVariants}
        animate={focused ? "focused" : "unfocused"}
        className="relative"
      >
        <InputComponent
          id={id}
          type={type === "textarea" ? undefined : type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          rows={type === "textarea" ? rows : undefined}
          className={`glass-input w-full px-4 py-3 md:py-4 rounded-xl focus:outline-none text-base transition-all duration-300 ${
            error ? "border-2 border-red-300" : ""
          } ${type === "textarea" ? "resize-y min-h-[100px]" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        />
      </motion.div>

      {helperText && !error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          id={`${id}-helper`}
          className="text-xs text-gray-500"
        >
          {helperText}
        </motion.p>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          id={`${id}-error`}
          className="text-sm text-red-500 flex items-center space-x-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </motion.p>
      )}
    </motion.div>
  );
}


