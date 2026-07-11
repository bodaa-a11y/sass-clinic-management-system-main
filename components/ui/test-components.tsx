'use client'

import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Input } from '@/components/ui/input-redesigned'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

export function TestComponents() {
  return (
    <PageTransition>
      <div className="space-y-6 p-6">
        <SlideIn direction="up" delay={0.1}>
          <h1 className="text-3xl font-bold text-slate-900">اختبار المكونات</h1>
        </SlideIn>

        <SlideIn direction="up" delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Card Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">هذا اختبار لمكون Card</p>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn direction="up" delay={0.3}>
          <div className="flex gap-4">
            <HoverScale>
              <Button>Button Test</Button>
            </HoverScale>
            <HoverScale>
              <Button variant="outline">Outline Button</Button>
            </HoverScale>
          </div>
        </SlideIn>

        <SlideIn direction="up" delay={0.4}>
          <div className="flex gap-4">
            <Badge>Badge Test</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
          </div>
        </SlideIn>

        <SlideIn direction="up" delay={0.5}>
          <Input placeholder="Input Test" />
        </SlideIn>
      </div>
    </PageTransition>
  )
}
