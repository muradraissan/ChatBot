"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ChatMockData = {
  id: string;
  customerName: string;
  phoneNumber: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  assignedAgentInitials?: string; // e.g. "AH"
  status: "UNASSIGNED" | "ACTIVE" | "RESOLVED";
};

interface ChatListProps {
  chats: ChatMockData[];
  selectedChatId?: string;
  onSelectChat: (id: string) => void;
}

export function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
  return (
    <div className="w-[350px] border-r border-slate-200 bg-slate-50 flex flex-col h-full">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search contacts..." 
            className="pl-9 bg-slate-100 border-transparent focus-visible:ring-indigo-500 rounded-xl"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-200/50 flex items-start gap-3 relative ${
                selectedChatId === chat.id ? "bg-white shadow-sm ring-1 ring-slate-200" : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-12 w-12 border border-slate-200">
                  <AvatarImage src={chat.avatarUrl} alt={chat.customerName} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                    {chat.customerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {chat.status === "ACTIVE" && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 truncate pr-2">
                    {chat.customerName}
                  </span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {chat.timestamp}
                  </span>
                </div>

                <p className="text-sm text-slate-600 truncate mb-1.5">
                  {chat.lastMessage}
                </p>

                {/* Badges Row */}
                <div className="flex items-center justify-between">
                  {chat.status === "UNASSIGNED" ? (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 animate-pulse px-1.5 py-0">
                      Unassigned
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-1.5 py-0 border-indigo-100">
                      [{chat.assignedAgentInitials}] Assigned
                    </Badge>
                  )}

                  {chat.unreadCount > 0 && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-full px-2 py-0 text-[10px] font-bold">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
