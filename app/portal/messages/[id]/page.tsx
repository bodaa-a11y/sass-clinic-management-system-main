'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  subject: string | null;
  message: string;
  priority: 'normal' | 'urgent';
  isRead: boolean;
  senderType: string;
  createdAt: string;
}

export default function MessageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const messageId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchMessage();
  }, [messageId]);

  const fetchMessage = async () => {
    try {
      // TODO: Fetch message details from API
      // For now, this is a placeholder
      setIsLoading(false);
    } catch (error) {
      console.error('Fetch message error:', error);
      toast.error('فشل في تحميل الرسالة');
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      toast.error('يرجى إدخال نص الرسالة');
      return;
    }

    setIsSending(true);
    try {
      // TODO: Send reply to API
      toast.success('تم إرسال الرد بنجاح');
      setReplyText('');
    } catch (error) {
      console.error('Send reply error:', error);
      toast.error('فشل في إرسال الرد');
    } finally {
      setIsSending(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/portal/messages"
            className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة إلى الرسائل
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">تفاصيل الرسالة</h1>
        </div>

        {/* Message Detail */}
        {message && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityBadge(message.priority)}
                  </div>
                  <CardTitle className="text-2xl">
                    {message.subject || 'بدون موضوع'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-2">
                    <Clock className="h-4 w-4" />
                    {formatDate(message.createdAt)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reply Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">إرسال رد</CardTitle>
            <CardDescription>
              اكتب ردك أدناه وإرساله إلى فريق الرعاية الصحية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reply">الرد</Label>
                <textarea
                  id="reply"
                  className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right resize-none"
                  placeholder="اكتب رسالتك هنا..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSending}
                />
              </div>
              <Button
                onClick={handleSendReply}
                disabled={isSending || !replyText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="ml-2 h-4 w-4" />
                    إرسال الرد
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
