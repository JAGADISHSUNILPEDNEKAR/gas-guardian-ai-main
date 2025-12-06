import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementsProps {
  userStats?: {
    totalSaved: number;
    transactionCount: number;
    optimalRate: number;
  };
}

export function Achievements({ userStats }: AchievementsProps) {
  const achievements: Achievement[] = [
    {
      id: 'first-optimization',
      name: 'First Optimization',
      description: 'Save $10+ on your first transaction',
      icon: <Star className="h-5 w-5" />,
      unlocked: (userStats?.totalSaved || 0) >= 10,
      progress: userStats?.totalSaved || 0,
      maxProgress: 10,
    },
    {
      id: 'gas-guru',
      name: 'Gas Guru',
      description: 'Save $1,000+ in total',
      icon: <Trophy className="h-5 w-5" />,
      unlocked: (userStats?.totalSaved || 0) >= 1000,
      progress: userStats?.totalSaved || 0,
      maxProgress: 1000,
    },
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      description: 'Used GasGuard in the first week',
      icon: <Medal className="h-5 w-5" />,
      unlocked: true, // Would check actual date
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Achieve 90%+ optimal execution rate',
      icon: <Award className="h-5 w-5" />,
      unlocked: (userStats?.optimalRate || 0) >= 90,
      progress: userStats?.optimalRate || 0,
      maxProgress: 90,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>Unlock achievements by optimizing your gas usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 border rounded-lg ${
                achievement.unlocked
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-muted/50 border-muted'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    achievement.unlocked ? 'bg-green-500/20' : 'bg-muted'
                  }`}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{achievement.name}</h4>
                    {achievement.unlocked && (
                      <Badge variant="outline" className="text-green-500">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  {achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {Math.min(achievement.progress, achievement.maxProgress)} /{' '}
                          {achievement.maxProgress}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(
                              (achievement.progress / achievement.maxProgress) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

