import { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  useListStudioProjects, 
  useUpdateStudioProject, 
  useDeleteStudioProject, 
  usePublishStudioProject,
  useRequestStudioUpload,
  getListStudioProjectsQueryKey,
  getGetStudioSummaryQueryKey,
  getListStudioSnapshotsQueryKey,
  ProjectStatus,
  ProjectVisibility
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Trash2, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Link } from 'wouter';

export default function WorkspaceProject() {
  const [, params] = useRoute('/workspace/projects/:id');
  const projectId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useListStudioProjects();
  const project = projects?.find((p) => p.id === projectId);

  const updateProject = useUpdateStudioProject();
  const deleteProject = useDeleteStudioProject();
  const requestUpload = useRequestStudioUpload();
  const publishProject = usePublishStudioProject();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    publicStatus: '',
    status: ProjectStatus.Draft as ProjectStatus,
    visibility: ProjectVisibility.private as ProjectVisibility,
    logoPath: '' as string | null,
    imagePath: '' as string | null,
    privateNotes: '',
    privateFiles: [] as string[],
    displayOrder: 0
  });

  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (project && initializedRef.current !== project.id) {
      initializedRef.current = project.id;
      setFormData({
        name: project.name,
        slug: project.slug,
        description: project.description,
        category: project.category,
        publicStatus: project.publicStatus,
        status: project.status,
        visibility: project.visibility,
        logoPath: project.logoPath,
        imagePath: project.imagePath,
        privateNotes: project.privateNotes || '',
        privateFiles: project.privateFiles || [],
        displayOrder: project.displayOrder
      });
    }
  }, [project]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!projectId) return;
    updateProject.mutate(
      { projectId, data: formData },
      {
        onSuccess: (updated) => {
          toast({ title: 'Saved', description: 'Project details updated.' });
          queryClient.setQueryData(getListStudioProjectsQueryKey(), (old: any) => 
            old?.map((p: any) => p.id === projectId ? updated : p)
          );
        }
      }
    );
  };

  const handleDelete = () => {
    if (!projectId || !confirm('Are you sure you want to delete this project?')) return;
    deleteProject.mutate(
      { projectId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudioProjectsQueryKey() });
          setLocation('/workspace');
          toast({ title: 'Deleted', description: 'Project removed.' });
        }
      }
    );
  };

  const handlePublish = () => {
    if (!projectId) return;
    publishProject.mutate(
      { projectId },
      {
        onSuccess: () => {
          toast({ title: 'Published', description: 'Project pushed to public site.' });
          queryClient.invalidateQueries({ queryKey: getListStudioProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStudioSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStudioSnapshotsQueryKey() });
        }
      }
    );
  };

  const uploadFileToGCS = async (file: File) => {
    const res = await requestUpload.mutateAsync({
      data: { name: file.name, size: file.size, contentType: file.type }
    });
    
    const uploadResponse = await fetch(res.uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with ${uploadResponse.status}`);
    }
    return res.objectPath;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoPath' | 'imagePath' | 'privateFiles') => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    try {
      toast({ title: 'Uploading...', description: `Sending ${file.name}` });
      const objectPath = await uploadFileToGCS(file);
      
      let newValue: any = objectPath;
      if (field === 'privateFiles') {
        newValue = [...formData.privateFiles, objectPath];
      }
      
      setFormData(prev => ({ ...prev, [field]: newValue }));
      
      // Auto-save the new path
      updateProject.mutate({
        projectId,
        data: { ...formData, [field]: newValue }
      });
      
      toast({ title: 'Upload complete', description: 'File attached to project.' });
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const removePrivateFile = (pathToRemove: string) => {
    const newFiles = formData.privateFiles.filter(p => p !== pathToRemove);
    setFormData(prev => ({ ...prev, privateFiles: newFiles }));
    if (projectId) {
      updateProject.mutate({ projectId, data: { ...formData, privateFiles: newFiles } });
    }
  };

  if (isLoading || !project) {
    return (
      <WorkspaceLayout>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workspace">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif text-foreground truncate max-w-[300px]">
            {project.name || 'Untitled'}
          </h1>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-secondary-foreground">
            {project.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={updateProject.isPending}>
            {updateProject.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save Changes
          </Button>
          {project.status === ProjectStatus.Ready_for_review && (
            <Button size="sm" onClick={handlePublish} disabled={publishProject.isPending}>
              {publishProject.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info */}
          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Public Details</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => handleChange('name', e.target.value)} 
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input 
                  id="slug" 
                  value={formData.slug} 
                  onChange={(e) => handleChange('slug', e.target.value)} 
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Public Description</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => handleChange('description', e.target.value)} 
                className="min-h-[100px] bg-background"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={(e) => handleChange('category', e.target.value)} 
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicStatus">Public Status Label</Label>
                <Input 
                  id="publicStatus" 
                  value={formData.publicStatus} 
                  onChange={(e) => handleChange('publicStatus', e.target.value)} 
                  className="bg-background"
                  placeholder="e.g. In Progress, Completed"
                />
              </div>
            </div>
          </section>

          {/* Internal Notes */}
          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Internal Notes</h2>
            <Textarea 
              value={formData.privateNotes} 
              onChange={(e) => handleChange('privateNotes', e.target.value)} 
              className="min-h-[200px] bg-background font-mono text-sm"
              placeholder="Private editorial notes, sources, and context..."
            />
          </section>
        </div>

        <div className="space-y-8">
          {/* Metadata & Workflow */}
          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Workflow</h2>
            
            <div className="space-y-2">
              <Label>Editorial Status</Label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.Draft}>Draft</SelectItem>
                  <SelectItem value={ProjectStatus.Ready_for_review}>Ready for Review</SelectItem>
                  <SelectItem value={ProjectStatus.Published}>Published</SelectItem>
                  <SelectItem value={ProjectStatus.Archived}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={formData.visibility} onValueChange={(val) => handleChange('visibility', val)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectVisibility.private}>Private</SelectItem>
                  <SelectItem value={ProjectVisibility.public}>Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Assets */}
          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Public Assets</h2>
            
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {formData.logoPath ? (
                  <div className="flex items-center gap-2 rounded border border-border p-2 w-full text-sm">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate flex-1 font-mono text-xs">{formData.logoPath.split('/').pop()}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleChange('logoPath', null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative flex w-full items-center justify-center rounded border border-dashed border-border py-4">
                    <input type="file" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => handleFileUpload(e, 'logoPath')} />
                    <span className="flex items-center text-xs text-muted-foreground"><UploadCloud className="mr-2 h-4 w-4" /> Upload Logo</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Cover Image</Label>
              <div className="flex items-center gap-4">
                {formData.imagePath ? (
                  <div className="flex items-center gap-2 rounded border border-border p-2 w-full text-sm">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate flex-1 font-mono text-xs">{formData.imagePath.split('/').pop()}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleChange('imagePath', null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative flex w-full items-center justify-center rounded border border-dashed border-border py-4">
                    <input type="file" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => handleFileUpload(e, 'imagePath')} />
                    <span className="flex items-center text-xs text-muted-foreground"><UploadCloud className="mr-2 h-4 w-4" /> Upload Image</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Private Files */}
          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Private Files</h2>
            <p className="text-xs text-muted-foreground">Supporting documents, raw assets. Never public.</p>
            
            <div className="space-y-2">
              {formData.privateFiles.map((path, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded border border-border bg-background p-2 text-sm">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate flex-1 font-mono text-xs">{path.split('/').pop()}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePrivateFile(path)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <div className="relative flex w-full items-center justify-center rounded border border-dashed border-border py-4 mt-2 hover:bg-muted/50 transition-colors">
                <input type="file" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => handleFileUpload(e, 'privateFiles')} />
                <span className="flex items-center text-xs text-muted-foreground"><UploadCloud className="mr-2 h-4 w-4" /> Add Private File</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
