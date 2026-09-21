const typeOptions = {
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-700',
};

const roleOptions = {
  warning: 'status',
  error: 'alert',
} as const;

export function MessageBanner({ type, message, details }: Props) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${typeOptions[type]}`} role={roleOptions[type]}>
      <p className="font-medium">{message}</p>
      {details && details.length > 0 && (
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = {
  type: 'error' | 'warning';
  message: string;
  details?: string[];
};
