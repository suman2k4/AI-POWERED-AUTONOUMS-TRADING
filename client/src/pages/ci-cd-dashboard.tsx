import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch, 
  Zap, 
  Shield, 
  Rocket,
  Activity,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface PipelineRun {
  id: string;
  branch: string;
  commit: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  startTime: Date;
  duration?: number;
  stages: PipelineStage[];
}

interface PipelineStage {
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  duration?: number;
  logs?: string[];
}

export default function CICDDashboard() {
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const mockPipelineRuns: PipelineRun[] = [
    {
      id: "run-1",
      branch: "main",
      commit: "feat: Add AI trading insights",
      status: "success",
      startTime: new Date(Date.now() - 3600000),
      duration: 420,
      stages: [
        { name: "Test & Lint", status: "success", duration: 120 },
        { name: "Security Audit", status: "success", duration: 90 },
        { name: "Build Application", status: "success", duration: 150 },
        { name: "Deploy Production", status: "success", duration: 60 }
      ]
    },
    {
      id: "run-2",
      branch: "develop",
      commit: "fix: WebSocket connection stability",
      status: "running",
      startTime: new Date(Date.now() - 300000),
      stages: [
        { name: "Test & Lint", status: "success", duration: 125 },
        { name: "Security Audit", status: "running" },
        { name: "Build Application", status: "pending" },
        { name: "Deploy Staging", status: "pending" }
      ]
    },
    {
      id: "run-3",
      branch: "feature/portfolio-analytics",
      commit: "feat: Enhanced portfolio metrics",
      status: "failed",
      startTime: new Date(Date.now() - 7200000),
      duration: 200,
      stages: [
        { name: "Test & Lint", status: "success", duration: 110 },
        { name: "Security Audit", status: "failed", duration: 90, logs: ["High severity vulnerability found in dependency"] }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-success-green" size={16} />;
      case 'failed':
        return <XCircle className="text-error-red" size={16} />;
      case 'running':
        return <RefreshCw className="text-primary-blue animate-spin" size={16} />;
      case 'pending':
        return <Clock className="text-gray-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success-green';
      case 'failed':
        return 'bg-error-red';
      case 'running':
        return 'bg-primary-blue';
      case 'pending':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getOverallProgress = (stages: PipelineStage[]) => {
    const completed = stages.filter(s => s.status === 'success' || s.status === 'failed').length;
    return (completed / stages.length) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">CI/CD Pipeline</h1>
        <Button className="bg-primary-blue hover:bg-blue-600">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-success-green">94.2%</p>
              </div>
              <CheckCircle className="text-success-green" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Duration</p>
                <p className="text-2xl font-bold text-white">6m 45s</p>
              </div>
              <Activity className="text-primary-blue" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Deployments</p>
                <p className="text-2xl font-bold text-white">127</p>
              </div>
              <Rocket className="text-warning-orange" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Security Score</p>
                <p className="text-2xl font-bold text-success-green">A+</p>
              </div>
              <Shield className="text-success-green" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pipeline Runs */}
      <Card className="dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Recent Pipeline Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPipelineRuns.map((run) => (
              <div
                key={run.id}
                className="border border-dark-border rounded-lg p-4 hover:bg-slate-700/30 cursor-pointer transition-colors"
                onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <GitBranch size={14} className="text-gray-400" />
                        <span className="text-white font-medium">{run.branch}</span>
                        <Badge variant="outline" className="text-xs">
                          {run.commit.slice(0, 7)}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{run.commit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {formatDuration(run.duration)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {run.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <Progress
                    value={getOverallProgress(run.stages)}
                    className="h-2"
                  />
                </div>

                <div className="flex space-x-2">
                  {run.stages.map((stage, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      {getStatusIcon(stage.status)}
                      <span className="text-gray-300">{stage.name}</span>
                      {stage.duration && (
                        <span className="text-gray-500">
                          ({formatDuration(stage.duration)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {selectedRun === run.id && (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <h4 className="text-white font-medium mb-3">Pipeline Details</h4>
                    <div className="space-y-3">
                      {run.stages.map((stage, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(stage.status)}
                            <span className="text-white">{stage.name}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            {stage.duration && (
                              <span className="text-gray-400 text-sm">
                                {formatDuration(stage.duration)}
                              </span>
                            )}
                            {stage.logs && stage.logs.length > 0 && (
                              <div className="text-sm text-error-red">
                                <AlertTriangle size={14} className="inline mr-1" />
                                {stage.logs[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark-card border-dark-border">
          <CardHeader>
            <CardTitle className="text-white">Pipeline Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Auto-deploy on main</span>
              <Badge className="bg-success-green">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Security scanning</span>
              <Badge className="bg-success-green">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Test coverage threshold</span>
              <Badge variant="outline">85%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Performance testing</span>
              <Badge className="bg-primary-blue">Staging only</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card border-dark-border">
          <CardHeader>
            <CardTitle className="text-white">Environment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success-green rounded-full"></div>
                <span className="text-gray-300">Production</span>
              </div>
              <span className="text-white">v1.2.4</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-blue rounded-full animate-pulse"></div>
                <span className="text-gray-300">Staging</span>
              </div>
              <span className="text-white">v1.3.0-rc.1</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning-orange rounded-full"></div>
                <span className="text-gray-300">Development</span>
              </div>
              <span className="text-white">v1.3.0-dev</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}