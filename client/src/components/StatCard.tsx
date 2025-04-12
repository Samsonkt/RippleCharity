import { ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export default function StatCard({ title, value, change, isPositive = true }: StatCardProps) {
  return (
    <div className="bg-neutral-100 rounded-lg p-4">
      <div className="text-neutral-600 text-sm mb-1">{title}</div>
      <div className="text-2xl font-semibold text-neutral-800">{value}</div>
      
      {change && (
        <div className={`flex items-center text-xs ${isPositive ? 'text-emerald-600' : 'text-red-500'} mt-1`}>
          <ArrowUp 
            className={`h-4 w-4 mr-1 ${!isPositive && 'transform rotate-180'}`} 
          />
          <span>{change}</span>
        </div>
      )}
    </div>
  );
}
