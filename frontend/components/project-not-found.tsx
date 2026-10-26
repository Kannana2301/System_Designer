'use client';

import Link from 'next/link';
import { FolderX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ProjectLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ProjectNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <FolderX className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold">Project not found</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            This project does not exist, was deleted, or belongs to another
            account.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
