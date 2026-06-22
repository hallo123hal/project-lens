interface Props { message?: string }

export default function LoadingState({ message = 'Loading…' }: Props) {
  return (
    <div className="py-16 text-center text-gray-400 text-sm" aria-live="polite">
      <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
      <p className="m-0">{message}</p>
    </div>
  );
}
