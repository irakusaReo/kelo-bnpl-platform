import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export function RecentSales() {
  const recentSales = [
    { name: "John Doe", email: "john@example.com", amount: "+KSH 1,999.00" },
    { name: "Jane Smith", email: "jane@example.com", amount: "+KSH 39.00" },
    { name: "Mike Brown", email: "mike@example.com", amount: "+KSH 299.00" },
    { name: "Sara Wilson", email: "sara@example.com", amount: "+KSH 99.00" },
    { name: "Tom Lee", email: "tom@example.com", amount: "+KSH 1,500.00" },
  ];

  return (
    <div className="space-y-8">
      {recentSales.map((sale, index) => (
        <div className="flex items-center" key={index}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/avatars/0${index + 1}.png`} alt="Avatar" />
            <AvatarFallback>{sale.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">{sale.email}</p>
          </div>
          <div className="ml-auto font-medium">{sale.amount}</div>
        </div>
      ))}
    </div>
  );
}
