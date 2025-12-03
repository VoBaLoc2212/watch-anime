import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { Link } from "wouter";

interface UserMenuProps {
  username: string;
  avatarUrl?: string;
}

export function UserMenu({ username, avatarUrl }: UserMenuProps) {
  const handleLogout = () => {
    console.log("Logging out");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-testid="button-user-menu">
        <Avatar className="h-9 w-9 hover-elevate active-elevate-2 cursor-pointer">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{username}</span>
            <span className="text-xs text-muted-foreground">
              user@example.com
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid="menu-item-profile">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="menu-item-settings">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} data-testid="menu-item-logout">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
