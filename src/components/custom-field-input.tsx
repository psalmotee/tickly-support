// used
import { CustomFieldRecord } from "@/lib/supabase-helpers";

interface CustomFieldInputProps {
  field: CustomFieldRecord;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CustomFieldInput({
  field,
  value,
  onChange,
  error,
}: CustomFieldInputProps) {
  const baseClasses =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";
  const errorClasses = error ? "border-red-500" : "";

  if (field.field_type === "select") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} ${errorClasses}`}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  if (field.field_type === "textarea") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
          rows={4}
          className={`${baseClasses} resize-vertical ${errorClasses}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  // Text, email, tel, number
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.field_type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ""}
        className={`${baseClasses} ${errorClasses}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
