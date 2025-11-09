import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import TourSelector from './TourSelector';
import { HELP_MENU_CONFIG } from '@/lib/onboarding-config';
import { HelpCircle, RotateCcw, BookOpen, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/**
 * HelpMenu - Dropdown menu for help & onboarding options
 * Provides restart onboarding, tour access, and documentation links
 */
export default function HelpMenu() {
  const { resetOnboarding } = useOnboarding();
  const [showTourSelector, setShowTourSelector] = useState(false);

  const handleRestartOnboarding = () => {
    if (
      confirm(
        'This will restart the onboarding tutorial from the beginning. Continue?'
      )
    ) {
      resetOnboarding();
      toast.success('Onboarding tutorial restarted!');

      // Reload to trigger wizard
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleOpenTours = () => {
    setShowTourSelector(true);
  };

  const handleOpenDocs = () => {
    // Open documentation (update URL when docs are available)
    window.open('/docs', '_blank');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{HELP_MENU_CONFIG.trigger_label}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Help & Resources</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Restart Onboarding */}
          <DropdownMenuItem onClick={handleRestartOnboarding}>
            <RotateCcw className="w-4 h-4 mr-2" />
            <div className="flex-1">
              <div className="font-medium">Restart Onboarding</div>
              <div className="text-xs text-gray-500">
                Start the tutorial from the beginning
              </div>
            </div>
          </DropdownMenuItem>

          {/* Feature Tours */}
          <DropdownMenuItem onClick={handleOpenTours}>
            <BookOpen className="w-4 h-4 mr-2" />
            <div className="flex-1">
              <div className="font-medium">Feature Tours</div>
              <div className="text-xs text-gray-500">
                Learn about specific features
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Documentation */}
          <DropdownMenuItem onClick={handleOpenDocs}>
            <ExternalLink className="w-4 h-4 mr-2" />
            <div className="flex-1">
              <div className="font-medium">Documentation</div>
              <div className="text-xs text-gray-500">
                Read the full platform guide
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tour Selector Dialog */}
      <TourSelector open={showTourSelector} onOpenChange={setShowTourSelector} />
    </>
  );
}
