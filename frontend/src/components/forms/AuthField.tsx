type AuthFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
};

export default function AuthField({ label, type = 'text', placeholder = 'Value' }: AuthFieldProps) {
  return (
    <label className="block space-y-2 text-left">
      <span className="block text-[0.95rem] font-normal leading-none text-[#222]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-[0.55rem] border border-black/10 px-4 py-3 text-[0.95rem] outline-none transition placeholder:text-black/25 focus:border-black/30"
      />
    </label>
  );
}