import { Loader2 } from "lucide-react";

interface SpinnerProps {
    message?: string;
}

export function Spinner({ message = "AI is thinking..." }: SpinnerProps) {
    return (
        <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">{message}</span>
        </div>
    );
}