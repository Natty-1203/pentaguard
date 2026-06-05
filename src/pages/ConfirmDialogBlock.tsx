import React from 'react';
import { Button } from '@/src/components/ui/button';

export default function ConfirmDialogBlockPage() {
  return (
    <div className="min-h-[600px] bg-[#f8fafc] p-10 flex flex-col items-center">
      
      <div className="mb-8 text-left w-full max-w-[360px]">
        <h2 className="text-xl font-bold text-gray-900 mb-1">(Block) ConfirmDialog</h2>
        <p className="text-sm text-gray-500">Component testing block</p>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Are you sure you want to cancel policy <span className="font-semibold text-gray-900">PG-2024-0001</span> for Mulualem Tesfaye? This action cannot be undone and will terminate coverage immediately.
        </p>
        
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 bg-white font-semibold">
            Keep Policy
          </Button>
          <Button className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm">
            Yes, Cancel Policy
          </Button>
        </div>
      </div>

    </div>
  );
}
