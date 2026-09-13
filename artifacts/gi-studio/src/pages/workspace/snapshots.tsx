import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { useListStudioSnapshots, useRollbackStudioSnapshot, getListStudioSnapshotsQueryKey, getListStudioProjectsQueryKey, getGetStudioSummaryQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function WorkspaceSnapshots() {
  const { data: snapshots, isLoading } = useListStudioSnapshots();
  const rollbackSnapshot = useRollbackStudioSnapshot();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRollback = (snapshotId: string) => {
    if (!confirm('Are you sure you want to rollback to this snapshot? This will revert the public site to exactly how it was.')) return;
    
    rollbackSnapshot.mutate(
      { snapshotId },
      {
        onSuccess: () => {
          toast({ title: 'Rolled back', description: 'The public site has been restored to the selected snapshot.' });
          queryClient.invalidateQueries({ queryKey: getListStudioSnapshotsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStudioProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStudioSummaryQueryKey() });
        }
      }
    );
  };

  return (
    <WorkspaceLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-serif text-foreground">Snapshots</h1>
        <p className="mt-2 text-sm text-muted-foreground font-sans">
          History of public site publications.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : snapshots?.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <History className="mb-4 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No snapshots yet.</p>
            <p className="text-xs text-muted-foreground/70">Publish a project to create the first snapshot.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {snapshots?.map((snapshot, idx) => (
              <div key={snapshot.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {format(new Date(snapshot.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </span>
                    {idx === 0 && (
                      <span className="rounded-full border border-primary text-primary px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-primary/5">
                        Current Live
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {snapshot.projectCount} project{snapshot.projectCount === 1 ? '' : 's'} published &middot; ID: {snapshot.id.substring(0, 8)}
                  </div>
                </div>
                
                {idx !== 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRollback(snapshot.id)}
                    disabled={rollbackSnapshot.isPending}
                    className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    {rollbackSnapshot.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RotateCcw className="mr-2 h-3 w-3" />}
                    Rollback
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
