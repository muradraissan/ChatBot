"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, MoreVertical, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatMockData } from "./ChatList";

export type MessageMock = {
  id: string;
  text: string;
  senderType: "CUSTOMER" | "AGENT";
  timestamp: string;
};

interface ChatWindowProps {
  chat: ChatMockData | null;
  messages: MessageMock[];
  onSendMessage: (text: string) => void;
  typingAgent?: string | null; // e.g. "Ali is typing..."
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function ChatWindow({ chat, messages, onSendMessage, typingAgent, onTypingStart, onTypingStop }: ChatWindowProps) {
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700">No Chat Selected</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Select a conversation from the left to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] h-full relative">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={chat.avatarUrl} alt={chat.customerName} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
              {chat.customerName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-slate-800 leading-tight">
              {chat.customerName}
            </h2>
            <p className="text-xs text-slate-500">{chat.phoneNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Assign Agent Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap h-8 px-3 rounded-full text-xs font-medium border border-slate-200 shadow-sm bg-white hover:bg-slate-100 focus-visible:outline-none">
              Assign Agent
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Assign to Me</DropdownMenuItem>
              <DropdownMenuItem>Ali (Sales)</DropdownMenuItem>
              <DropdownMenuItem>Sara (Support)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-slate-500 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Chat Area (Messages) */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-6 flex flex-col pb-8">
          {messages.map((msg) => {
            const isAgent = msg.senderType === "AGENT";
            return (
              <div
                key={msg.id}
                className={`flex max-w-[75%] ${isAgent ? "self-end" : "self-start"}`}
              >
                <div
                  className={`relative px-4 py-2.5 rounded-2xl shadow-sm text-[15px] ${
                    isAgent
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isAgent ? "text-indigo-200" : "text-slate-400"}`}>
                    <span className="text-[10px] uppercase font-medium tracking-wide">
                      {msg.timestamp}
                    </span>
                    {isAgent && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Typing Indicator Slot */}
      {typingAgent && (
        <div className="absolute bottom-[84px] left-6 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs font-medium text-slate-500">
            {typingAgent}
          </span>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full h-10 w-10">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all flex items-center shadow-sm px-4 py-1 min-h-[44px]">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-800 placeholder:text-slate-400 py-2"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => onTypingStart?.()}
              onBlur={() => onTypingStop?.()}
            />
          </div>

          <Button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full h-11 w-11 p-0 shadow-sm shadow-emerald-200 transition-all disabled:opacity-50 disabled:hover:bg-emerald-500"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
