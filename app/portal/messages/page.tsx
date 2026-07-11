'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  subject: string | null;
  message: string;
  priority: 'normal' | 'urgent';
  isRead: boolean;
  readAt: string | null;
  senderType: string;
  createdAt: string;
}

export default function PatientMessagesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/portal/messages');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      setMessages(data.messages || []);
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast.error('فشل في تحميل الرسائل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/portal/messages/mark-read/${messageId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
      ));
    } catch (error) {
      console.error('Mark as read error:', error);
      toast.error('فشل في تحديد الرسالة كمقروءة');
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') {
      return <Badge variant="destructive" className="bg-red-500">عاجل</Badge>;
    }
    return <Badge variant="secondary">عادي</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/portal/dashboard"
              className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى لوحة التحكم
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">الرسائل</h1>
            <p className="text-gray-600 mt-2">
              التواصل مع فريق الرعاية الصحية
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="ml-2 h-4 w-4" />
            رسالة جديدة
          </Button>
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد رسائل
              </h3>
              <p className="text-gray-600 mb-6">
                ابدأ محادثة مع فريق الرعاية الصحية
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="ml-2 h-4 w-4" />
                إرسال رسالة جديدة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  !message.isRead ? 'border-blue-500 border-2' : ''
                }`}
                onClick={() => {
                  if (!message.isRead) {
                    handleMarkAsRead(message.id);
                  }
                  router.push(`/portal/messages/${message.id}`);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityBadge(message.priority)}
                        {!message.isRead && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                            جديد
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {message.subject || 'بدون موضوع'}
                      </CardTitle>
                    </div>
                    <div className="text-left text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(message.createdAt)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 line-clamp-2">
                    {message.message}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                    {message.isRead ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>تمت القراءة</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span>غير مقروء</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
