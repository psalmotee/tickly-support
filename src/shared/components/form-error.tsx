import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <div className="flex gap-3 rounded-lg bg-destructive/10 p-3 border border-destructive/20">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
