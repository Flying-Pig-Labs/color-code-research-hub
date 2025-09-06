import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '@/hooks/v2';
import { Button } from '@/components/ui/button';

const Projects: React.FC = () => {
  const { data } = useProjects();
  const createProject = useCreateProject();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    createProject.mutate({ title, domain });
    setTitle('');
    setDomain('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <div className="flex space-x-2">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="border p-1" />
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Domain" className="border p-1" />
        <Button onClick={handleCreate}>Create</Button>
      </div>
      {data && data.length > 0 ? (
        <ul className="space-y-2">
          {data.map(p => (
            <li key={p.projectId} className="border p-2 rounded">
              <Link to={`/v2/projects/${p.projectId}`}>{p.title}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      )}
    </div>
  );
};

export default Projects;
