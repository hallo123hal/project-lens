interface Props { message?: string }

export default function LoadingState({ message = 'Loading…' }: Props) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: '#626F86' }} aria-live="polite">
      {message}
    </div>
  );
}
