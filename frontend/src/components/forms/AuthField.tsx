type AuthFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
};

export default function AuthField({ label, type = 'text', placeholder = 'Value' }: AuthFieldProps) {
  return (
    <label className="block space-y-2 text-left">
      <span className="block text-sm font-medium text-black">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-black/15 px-4 py-3 text-base outline-none transition focus:border-black/40"
      />
    </label>
  );
}