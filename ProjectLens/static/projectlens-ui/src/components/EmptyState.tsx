interface Props { title: string; description?: string }

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="py-16 text-center">
      <p className="font-semibold text-gray-700 text-base m-0">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-2 m-0">{description}</p>}
    </div>
  );
}
