import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

interface DrillDownModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs?: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  children?: React.ReactNode;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  tabs,
  children,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111111] border-[#27272A]">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{title}</DialogTitle>
          {subtitle && (
            <DialogDescription className="text-sm text-[#A1A1AA] mt-1">
              {subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-4">
          {tabs && tabs.length > 0 ? (
            <Tabs defaultValue={tabs[0].id} className="w-full">
              <TabsList
                className="grid w-full bg-[#161616] border border-[#27272A]"
                style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
              >
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="text-xs data-[state=active]:bg-frammer-red/15 data-[state=active]:text-white data-[state=active]:border-frammer-red/30"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            children
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
