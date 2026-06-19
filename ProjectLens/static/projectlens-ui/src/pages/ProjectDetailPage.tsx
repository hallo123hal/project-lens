interface Props { projectKey: string; onBack: () => void; }
export default function ProjectDetailPage({ projectKey, onBack }: Props) {
  return <div><button onClick={onBack}>Back</button><h1>Project: {projectKey}</h1></div>;
}
