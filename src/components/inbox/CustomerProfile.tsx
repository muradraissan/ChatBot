"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, Phone, Mail, Clock, Plus, MessageSquarePlus } from "lucide-react";
import { ChatMockData } from "./ChatList";
import { Button } from "@/components/ui/button";

interface CustomerProfileProps {
  chat: ChatMockData | null;
  onSelectQuickReply: (text: string) => void;
}

const quickReplies = [
  { id: "1", title: "Welcome Greeting", text: "Hello! Thank you for reaching out to Iraq Rasael. How can I help you today?" },
  { id: "2", title: "Pricing Details", text: "Our pricing starts at $49/mo for the starter plan. Would you like me to send you the full brochure?" },
  { id: "3", title: "Address Request", text: "Could you please provide your full shipping address and nearest landmark?" },
];

const mockTags = [
  { label: "VIP Customer", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "Pending Payment", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "Awaiting Shipping", color: "bg-amber-100 text-amber-700 border-amber-200" },
];

export function CustomerProfile({ chat, onSelectQuickReply }: CustomerProfileProps) {
  if (!chat) {
    return (
      <div className="w-[300px] border-l border-slate-200 bg-white flex flex-col h-full p-6 text-center justify-center text-slate-400">
        <p>Profile details will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-[300px] border-l border-slate-200 bg-white flex flex-col h-full shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.05)] z-20 relative">
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Avatar & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md mb-4 ring-1 ring-slate-100">
              <AvatarImage src={chat.avatarUrl} alt={chat.customerName} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-emerald-400 text-white text-2xl font-bold">
                {chat.customerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-slate-800">{chat.customerName}</h2>
            <div className="flex items-center text-slate-500 mt-1.5 text-sm gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Baghdad, Iraq</span>
            </div>
            <div className="flex items-center text-slate-500 mt-1 text-sm gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Local time: 10:45 AM</span>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Contact Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-medium">{chat.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-medium">customer@example.com</span>
              </div>
            </div>
          </div>

          {/* Smart Tags */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Smart Tags</h3>
              <button className="text-indigo-500 hover:bg-indigo-50 rounded-full p-1 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {mockTags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className={`font-medium ${tag.color}`}>
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Replies Accordion */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Workspace Tools</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="quick-replies" className="border-slate-200">
                <AccordionTrigger className="text-sm font-semibold text-slate-700 hover:text-indigo-600">
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4" />
                    Quick Replies
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {quickReplies.map((reply) => (
                      <div 
                        key={reply.id} 
                        onClick={() => onSelectQuickReply(reply.text)}
                        className="group p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 cursor-pointer transition-all"
                      >
                        <h4 className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 mb-1">
                          {reply.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="order-history" className="border-slate-200">
                <AccordionTrigger className="text-sm font-semibold text-slate-700 hover:text-indigo-600">
                  Order History
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500 pb-4">
                  No previous orders found for this contact.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
