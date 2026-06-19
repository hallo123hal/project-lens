interface Props { title: string; description?: string }

export default function EmptyState({ title, description }: Props) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>{title}</p>
      {description && <p style={{ color: '#626F86', marginTop: 8 }}>{description}</p>}
    </div>
  );
}
