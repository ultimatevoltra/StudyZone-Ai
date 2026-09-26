interface ModelLogoProps {
  model: string;
  size?: number;
}

export default function ModelLogo({ model, size = 18 }: ModelLogoProps) {
  if (model.toLowerCase().includes("llama")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#6f4ce8" />
        <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="sans-serif">Ll</text>
      </svg>
    );
  }
  if (model.toLowerCase().includes("mistral")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#fa6b05" />
        <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="sans-serif">M</text>
      </svg>
    );
  }
  if (model.toLowerCase().includes("gemma") || model.toLowerCase().includes("gamma")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#1a73e8" />
        <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="sans-serif">G</text>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#10b981" />
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="sans-serif">AI</text>
    </svg>
  );
}
