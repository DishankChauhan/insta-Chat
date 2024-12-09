'use client';

export function MessageLoader() {
  return (
    <div className="flex items-center space-x-2 p-4">
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-64 animate-pulse rounded bg-muted"></div>
      </div>
    </div>
  );
}