import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, FileText } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const TestCases = () => {
  const [testCases, setTestCases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    description: '',
    type: 'functional',
    steps: '',
    expected_result: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchProjects();
    fetchTestCases();
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

  const fetchTestCases = async () => {
    try {
      const response = await api.get('/test-cases');
      setTestCases(response.data);
    } catch (error) {
      toast.error('Failed to load test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        steps: formData.steps.split('\n').filter((s) => s.trim()),
      };
      await api.post('/test-cases', payload);
      toast.success('Test case created successfully!');
      setDialogOpen(false);
      fetchTestCases();
      setFormData({
        project_id: projects[0]?.id || '',
        name: '',
        description: '',
        type: 'functional',
        steps: '',
        expected_result: '',
        priority: 'medium',
      });
    } catch (error) {
      toast.error('Failed to create test case');
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
      <div className="flex-1 overflow-auto" data-testid="test-cases-container">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black font-heading tracking-tighter mb-2" data-testid="test-cases-title">
                Test Cases
              </h1>
              <p className="text-base text-muted-foreground">Manage your test cases</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                  data-testid="create-test-case-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> New Test Case
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold font-heading">Create Test Case</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="test-case-form">
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
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-white/10"
                      required
                      data-testid="test-case-name-input"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="bg-background border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="functional">Functional</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger className="bg-background border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Steps (one per line)</Label>
                    <Textarea
                      value={formData.steps}
                      onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                      className="bg-background border-white/10"
                      rows={4}
                      placeholder="Step 1: Login to the application&#10;Step 2: Navigate to dashboard&#10;Step 3: Click on test button"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Result</Label>
                    <Textarea
                      value={formData.expected_result}
                      onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                      className="bg-background border-white/10"
                      rows={2}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                    data-testid="submit-test-case-btn"
                  >
                    Create Test Case
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {testCases.length === 0 ? (
            <Card className="p-12 bg-card border border-white/10 text-center" data-testid="no-test-cases-message">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No test cases yet</h3>
              <p className="text-muted-foreground">Create your first test case to get started</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {testCases.map((testCase, index) => (
                <motion.div
                  key={testCase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 bg-card border border-white/10 hover:border-primary/50 transition-all" data-testid={`test-case-card-${index}`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold font-heading">{testCase.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          testCase.priority === 'high'
                            ? 'bg-destructive/20 text-destructive'
                            : testCase.priority === 'medium'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {testCase.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{testCase.description}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-background rounded border border-white/10 font-mono">{testCase.type}</span>
                      <span className="px-2 py-1 bg-background rounded border border-white/10 font-mono">
                        {testCase.steps.length} steps
                      </span>
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

export default TestCases;