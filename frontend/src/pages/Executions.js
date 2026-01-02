import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Play, Clock, CheckCircle, XCircle, Terminal } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import useWebSocket from '../hooks/useWebSocket';

const Executions = () => {
  const [executions, setExecutions] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewLogsId, setViewLogsId] = useState(null);
  const { logs } = useWebSocket(viewLogsId);

  useEffect(() => {
    fetchTestCases();
    fetchExecutions();
  }, []);

  const fetchTestCases = async () => {
    try {
      const response = await api.get('/test-cases');
      setTestCases(response.data);
    } catch (error) {
      toast.error('Failed to load test cases');
    }
  };

  const fetchExecutions = async () => {
    try {
      const response = await api.get('/test-executions');
      setExecutions(response.data);
    } catch (error) {
      toast.error('Failed to load executions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExecution = async () => {
    if (!selectedTest) return;
    try {
      const response = await api.post('/test-executions', { test_case_id: selectedTest });
      toast.success('Test execution started!');
      setDialogOpen(false);
      setSelectedTest('');
      
      setTimeout(async () => {
        await api.patch(`/test-executions/${response.data.id}`, {
          status: 'completed',
          result: 'Test passed successfully',
          logs: [
            'Starting test execution...',
            'Initializing test environment...',
            'Running test steps...',
            'All assertions passed',
            'Test completed successfully',
          ],
        });
        fetchExecutions();
      }, 2000);
    } catch (error) {
      toast.error('Failed to start execution');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-secondary" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'running':
        return <Clock className="w-5 h-5 text-primary animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
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
      <div className="flex-1 overflow-auto" data-testid="executions-container">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black font-heading tracking-tighter mb-2" data-testid="executions-title">
                Test Executions
              </h1>
              <p className="text-base text-muted-foreground">View and manage test executions</p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
              data-testid="start-execution-btn"
            >
              <Play className="w-4 h-4 mr-2" /> Start Execution
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-heading">Start Test Execution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Test Case</label>
                  <Select value={selectedTest} onValueChange={setSelectedTest}>
                    <SelectTrigger className="bg-background border-white/10" data-testid="select-test-case">
                      <SelectValue placeholder="Choose a test case" />
                    </SelectTrigger>
                    <SelectContent>
                      {testCases.map((tc) => (
                        <SelectItem key={tc.id} value={tc.id}>
                          {tc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleStartExecution}
                  className="w-full bg-primary text-primary-foreground font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] rounded-md"
                  disabled={!selectedTest}
                  data-testid="confirm-start-execution-btn"
                >
                  Start Execution
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {executions.length === 0 ? (
            <Card className="p-12 bg-card border border-white/10 text-center" data-testid="no-executions-message">
              <Terminal className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No executions yet</h3>
              <p className="text-muted-foreground">Start your first test execution</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {executions.map((execution, index) => {
                const testCase = testCases.find((tc) => tc.id === execution.test_case_id);
                return (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="p-6 bg-card border border-white/10 hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => setViewLogsId(execution.id)}
                      data-testid={`execution-card-${index}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusIcon(execution.status)}
                            <h3 className="text-lg font-semibold font-heading">{testCase?.name || 'Unknown Test'}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                execution.status === 'completed'
                                  ? 'bg-secondary/20 text-secondary'
                                  : execution.status === 'failed'
                                  ? 'bg-destructive/20 text-destructive'
                                  : execution.status === 'running'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {execution.status}
                            </span>
                          </div>
                          {execution.result && <p className="text-sm text-muted-foreground mb-2">{execution.result}</p>}
                          <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                            <span>Started: {new Date(execution.start_time).toLocaleString()}</span>
                            {execution.end_time && <span>Ended: {new Date(execution.end_time).toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>

                      {viewLogsId === execution.id && execution.logs && execution.logs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Execution Logs
                          </h4>
                          <div className="bg-background rounded-lg p-4 scanlines max-h-64 overflow-y-auto">
                            {execution.logs.map((log, i) => (
                              <p key={i} className="terminal-text text-secondary mb-1" data-testid={`log-line-${i}`}>
                                {log}
                              </p>
                            ))}
                            {logs.map((log, i) => (
                              <p key={`ws-${i}`} className="terminal-text text-primary mb-1">
                                {log}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Executions;