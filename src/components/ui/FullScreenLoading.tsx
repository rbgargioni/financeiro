import { Loader2 } from "lucide-react";

export function FullScreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={28} />
    </div>
  );
}
