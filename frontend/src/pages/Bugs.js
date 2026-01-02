import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Bug as BugIcon } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '../utils/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const Bugs = () => {
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    severity: 'medium',
  });

  useEffect(() => {
    fetchProjects();
    fetchBugs();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, project_id: response.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const fetchBugs = async () => {
    try {
      const response = await api.get('/bugs');
      setBugs(response.data);
    } catch (error) {
      toast.error('Failed to load bugs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bugs', formData);
      toast.success('Bug reported successfully!');
      setDialogOpen(false);
      fetchBugs();
      setFormData({
        project_id: projects[0]?.id || '',
        title: '',
        description: '',
        severity: 'medium',
      });
    } catch (error) {
      toast.error('Failed to create bug');
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
      <div className="flex-1 overflow-auto" data-testid="bugs-container">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black font-heading tracking-tighter mb-2" data-testid="bugs-title">
                Bug Tracker
              </h1>
              <p className="text-base text-muted-foreground">Track and manage bugs</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                  data-testid="report-bug-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Report Bug
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold font-heading">Report Bug</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="bug-form">
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                      <SelectTrigger className="bg-background border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-background border-white/10"
                      required
                      data-testid="bug-title-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-background border-white/10"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                      <SelectTrigger className="bg-background border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                    data-testid="submit-bug-btn"
                  >
                    Report Bug
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {bugs.length === 0 ? (
            <Card className="p-12 bg-card border border-white/10 text-center" data-testid="no-bugs-message">
              <BugIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bugs reported</h3>
              <p className="text-muted-foreground">All systems operational</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bugs.map((bug, index) => (
                <motion.div
                  key={bug.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 bg-card border border-white/10 hover:border-primary/50 transition-all" data-testid={`bug-card-${index}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold font-heading">{bug.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              bug.severity === 'critical'
                                ? 'bg-destructive/20 text-destructive'
                                : bug.severity === 'high'
                                ? 'bg-destructive/10 text-destructive'
                                : bug.severity === 'medium'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {bug.severity}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              bug.status === 'open'
                                ? 'bg-secondary/20 text-secondary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {bug.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{bug.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Reported: {new Date(bug.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bugs;