import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const InstitutionUsers: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Membros da Instituição</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  M{i}
                </div>
                <div className="flex-1">
                  <p className="font-bold">Membro {i}</p>
                  <p className="text-xs text-muted-foreground">membro{i}@empresa.com</p>
                </div>
                <Badge variant={i % 2 === 0 ? 'default' : 'outline'}>
                  {i % 2 === 0 ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
