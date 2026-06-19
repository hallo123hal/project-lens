interface Props { onBack: () => void; }
export default function SettingsPage({ onBack }: Props) {
  return <div><button onClick={onBack}>Back</button><h1>Settings</h1></div>;
}
