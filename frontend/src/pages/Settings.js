import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, FolderOpen } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import api from '../utils/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      toast.success('Project created successfully!');
      setDialogOpen(false);
      fetchProjects();
      setFormData({ name: '', description: '' });
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto" data-testid="settings-container">
        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-black font-heading tracking-tighter mb-2" data-testid="settings-title">
              Settings
            </h1>
            <p className="text-base text-muted-foreground">Manage your account and projects</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 bg-card border border-white/10" data-testid="profile-card">
                <h2 className="text-2xl font-semibold font-heading tracking-tight mb-6">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="text-lg font-medium mt-1">{user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-lg font-medium mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Role</Label>
                    <p className="text-lg font-medium mt-1 capitalize">{user?.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 bg-card border border-white/10" data-testid="projects-card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold font-heading tracking-tight">Projects</h2>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                        data-testid="create-project-btn"
                      >
                        <Plus className="w-4 h-4 mr-2" /> New Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-heading">Create Project</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4" data-testid="project-form">
                        <div className="space-y-2">
                          <Label>Project Name</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-background border-white/10"
                            required
                            data-testid="project-name-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-background border-white/10"
                            rows={3}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                          data-testid="submit-project-btn"
                        >
                          Create Project
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-8" data-testid="no-projects-message">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No projects yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project, index) => (
                      <div
                        key={project.id}
                        className="p-4 rounded-lg bg-background border border-white/10"
                        data-testid={`project-item-${index}`}
                      >
                        <h3 className="font-semibold mb-1">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;