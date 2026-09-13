import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { useGetStudioSummary, useListStudioProjects, useCreateStudioProject, useReorderStudioProjects, getListStudioProjectsQueryKey, getGetStudioSummaryQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Plus, ArrowRight, ArrowUp, ArrowDown, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function WorkspaceList() {
  const { data: summary, isLoading: loadingSummary } = useGetStudioSummary();
  const { data: projects, isLoading: loadingProjects } = useListStudioProjects();
  const createProject = useCreateStudioProject();
  const reorderProjects = useReorderStudioProjects();
  const queryClient = useQueryClient();

  const handleCreate = () => {
    createProject.mutate(
      {
        data: {
          name: "Untitled Project",
          slug: `untitled-${Date.now()}`,
          description: "",
          category: "Research",
          publicStatus: "In Progress",
          status: "Draft",
          visibility: "private",
          displayOrder: projects ? projects.length : 0,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudioProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStudioSummaryQueryKey() });
        }
      }
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!projects) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= projects.length) return;

    const newProjects = [...projects];
    const [moved] = newProjects.splice(index, 1);
    newProjects.splice(newIndex, 0, moved);

    // Optimistically update
    queryClient.setQueryData(getListStudioProjectsQueryKey(), newProjects);

    reorderProjects.mutate(
      { data: { projectIds: newProjects.map(p => p.id) } },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getListStudioProjectsQueryKey() });
        }
      }
    );
  };

  return (
    <WorkspaceLayout>
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground font-sans">
            Manage your research and public intelligence content.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={createProject.isPending} className="font-mono text-xs uppercase tracking-wider h-9">
          {createProject.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <SummaryCard label="Total" value={summary?.total} loading={loadingSummary} />
            <SummaryCard label="Drafts" value={summary?.drafts} loading={loadingSummary} />
            <SummaryCard label="Review" value={summary?.review} loading={loadingSummary} />
            <SummaryCard label="Published" value={summary?.published} loading={loadingSummary} />
            <SummaryCard label="Archived" value={summary?.archived} loading={loadingSummary} />
          </div>

          <div className="rounded-lg border border-border bg-card">
            {loadingProjects ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-foreground"></div>
              </div>
            ) : projects?.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground mb-4">No projects found.</p>
                <Button variant="outline" size="sm" onClick={handleCreate}>Create the first one</Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {projects?.map((project, index) => (
                  <div key={project.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <Link href={`/workspace/projects/${project.id}`} className="font-serif text-lg font-medium text-foreground hover:underline">
                          {project.name}
                        </Link>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-secondary-foreground">
                          {project.status}
                        </span>
                        {project.visibility === 'public' && (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            Public
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')} &middot; {project.category}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col border-r border-border pr-2 mr-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          disabled={index === 0 || reorderProjects.isPending}
                          onClick={() => handleMove(index, 'up')}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          disabled={index === projects.length - 1 || reorderProjects.isPending}
                          onClick={() => handleMove(index, 'down')}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Link href={`/workspace/projects/${project.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-10 flex flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Live Preview</h2>
              <a href="/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Open in new tab">
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative h-[600px] w-full bg-background overflow-hidden">
              <iframe 
                src="/" 
                title="Public Site Preview" 
                className="absolute inset-0 h-full w-full border-0 pointer-events-none"
                style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%', height: '125%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

function SummaryCard({ label, value, loading }: { label: string; value?: number; loading: boolean }) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <span className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      {loading ? (
        <div className="h-6 w-12 animate-pulse rounded bg-muted" />
      ) : (
        <span className="font-serif text-2xl text-foreground">{value ?? 0}</span>
      )}
    </div>
  );
}
