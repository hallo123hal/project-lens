interface Props {
  onProjectClick: (key: string) => void;
  onSettingsClick: () => void;
}
export default function DashboardPage({ onSettingsClick }: Props) {
  return <div><h1>Portfolio Risk Dashboard</h1><button onClick={onSettingsClick}>Settings</button></div>;
}
