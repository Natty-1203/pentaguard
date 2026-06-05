import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { StatusBadge, StatusVariant } from '@/src/components/ui/status-badge';

export default function StatusBadgesPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="py-5 border-b border-gray-50">
          <CardTitle className="text-base font-bold text-gray-900">Status Badges</CardTitle>
          <p className="text-xs font-medium text-gray-500 mt-1">All platform status variants</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-8">
            <StatusBadge status="active" className="justify-start w-full" />
            <StatusBadge status="inactive" className="justify-start w-full" />
            
            <StatusBadge status="pending" className="justify-start w-full" />
            <StatusBadge status="underReview" className="justify-start w-full" />
            
            <StatusBadge status="approved" className="justify-start w-full" />
            <StatusBadge status="rejected" className="justify-start w-full" />
            
            <StatusBadge status="filed" className="justify-start w-full" />
            <StatusBadge status="paid" className="justify-start w-full" />
            
            <StatusBadge status="expired" className="justify-start w-full" />
            <StatusBadge status="suspended" className="justify-start w-full" />
            
            <StatusBadge status="trial" className="justify-start w-full" />
            <StatusBadge status="processing" className="justify-start w-full" />
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">PILL VARIANTS</h4>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="active" pill />
              <StatusBadge status="pending" pill />
              <StatusBadge status="rejected" pill />
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <StatusBadge status="filed" pill />
              <StatusBadge status="trial" pill />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
