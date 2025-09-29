"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  CreditCard, 
  TrendingUp,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "loan_approved" | "loan_pending" | "loan_rejected" | "payment_received" | "new_customer" | "revenue_milestone";
  title: string;
  description: string;
  amount?: number;
  customer?: string;
  timestamp: Date;
  status?: "success" | "pending" | "warning" | "error";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  description?: string;
  maxItems?: number;
}

export function ActivityFeed({ 
  activities, 
  title = "Recent Activity", 
  description = "Latest updates from your business",
  maxItems = 10 
}: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "loan_approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "loan_pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "loan_rejected":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "payment_received":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "new_customer":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "revenue_milestone":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: ActivityItem["status"]) => {
    if (!status) return null;
    
    const variants = {
      success: "default",
      pending: "secondary",
      warning: "outline",
      error: "destructive"
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return "";
    return `KES ${amount.toLocaleString()}`;
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(activity.status)}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {activity.customer && (
                        <span>Customer: {activity.customer}</span>
                      )}
                      {activity.amount && (
                        <span>{formatAmount(activity.amount)}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {activities.length > maxItems && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}