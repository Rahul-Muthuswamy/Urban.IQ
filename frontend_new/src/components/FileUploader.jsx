import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FileUploader({ onFileChange, preview, accept = "image/*", label = "Upload", isBanner = false }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      onFileChange(file);
    }
  };

  const handleRemove = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <div className={`${isBanner ? "h-32 md:h-40" : "h-32 w-32"} rounded-xl overflow-hidden glass shadow-glass-lg`}>
              <img
                src={preview}
                alt="Preview"
                className={`w-full h-full object-cover ${isBanner ? "" : "rounded-full"}`}
              />
            </div>
            <motion.button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Remove image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.label
          htmlFor={`file-upload-${isBanner ? "banner" : "logo"}`}
          className="block cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`${isBanner ? "h-32 md:h-40" : "h-32 w-32"} glass rounded-xl border-2 border-dashed border-gray-300 hover:border-primary transition-colors flex flex-col items-center justify-center space-y-2 group`}>
            <svg className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-gray-600 group-hover:text-primary transition-colors font-medium">{label}</span>
            <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
          </div>
          <input
            ref={fileInputRef}
            id={`file-upload-${isBanner ? "banner" : "logo"}`}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            aria-label={label}
          />
        </motion.label>
      )}
    </div>
  );
}


