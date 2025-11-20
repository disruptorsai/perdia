# src/components - React Components

UI components for Perdia Education using shadcn/ui (Radix UI + TailwindCSS).

## Folder Structure

```
components/
├── ui/              # shadcn/ui primitives (Radix-based)
├── wizard/          # Article Generation Wizard
├── layout/          # App layouts (V1, V2)
├── agents/          # AI agent interfaces
├── content/         # Content queue, editor
├── dashboard/       # Dashboard widgets
├── keywords/        # Keyword management
└── ...              # Other feature components
```

## UI Component Library

All base components are in `ui/` using shadcn/ui patterns:

### Form Controls
- `Button` - Action buttons with variants
- `Input` - Text input fields
- `Textarea` - Multi-line text
- `Select` - Dropdown selection
- `Checkbox` - Boolean toggle
- `Switch` - Toggle switch
- `RadioGroup` - Radio options
- `Slider` - Range slider

### Layout
- `Card` - Content containers
- `Separator` - Visual dividers
- `ScrollArea` - Scrollable containers
- `Tabs` - Tabbed navigation
- `Accordion` - Collapsible sections
- `Collapsible` - Show/hide content

### Overlay
- `Dialog` - Modal dialogs
- `AlertDialog` - Confirmation dialogs
- `Sheet` - Slide-out panels
- `Popover` - Floating content
- `Tooltip` - Hover tooltips
- `HoverCard` - Rich hover content
- `ContextMenu` - Right-click menus
- `DropdownMenu` - Dropdown menus

### Feedback
- `Toast` (sonner) - Notifications
- `Alert` - Inline alerts
- `Progress` - Progress bars
- `Skeleton` - Loading states

### Data Display
- `Table` - Data tables
- `Avatar` - User avatars
- `Badge` - Status badges
- `Calendar` - Date picker
- `Command` (cmdk) - Command palette

### Advanced
- `Carousel` - Image carousel
- `Resizable` - Resizable panels
- Charts (recharts)

## Common Patterns

### Page Layout

```javascript
import { AppLayout } from '@/components/layout/AppLayout';

export default function MyPage() {
  return (
    <AppLayout>
      <div className="p-6">
        {/* Page content */}
      </div>
    </AppLayout>
  );
}
```

**Available Layouts:**
- `AppLayout` - V1 full-featured layout
- `AppLayoutV2` - V2 simplified layout

### Data Fetching

```javascript
import { useState, useEffect } from 'react';
import { Keyword } from '@/lib/perdia-sdk';

function KeywordList() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKeywords() {
      const data = await Keyword.find({}, { limit: 50 });
      setKeywords(data);
      setLoading(false);
    }
    loadKeywords();
  }, []);

  if (loading) return <Skeleton className="h-20" />;

  return (
    <div>
      {keywords.map(k => (
        <div key={k.id}>{k.keyword}</div>
      ))}
    </div>
  );
}
```

### Realtime Subscriptions

```javascript
useEffect(() => {
  const subscription = Keyword.subscribe((payload) => {
    if (payload.eventType === 'INSERT') {
      setKeywords(prev => [...prev, payload.new]);
    }
    if (payload.eventType === 'UPDATE') {
      setKeywords(prev => prev.map(k =>
        k.id === payload.new.id ? payload.new : k
      ));
    }
    if (payload.eventType === 'DELETE') {
      setKeywords(prev => prev.filter(k => k.id !== payload.old.id));
    }
  });

  return () => subscription?.unsubscribe();
}, []);
```

### Forms with react-hook-form + zod

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  keyword: z.string().min(1, 'Required'),
  search_volume: z.number().min(0)
});

function KeywordForm({ onSubmit }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { keyword: '', search_volume: 0 }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input
        {...form.register('keyword')}
        placeholder="Keyword"
      />
      {form.formState.errors.keyword && (
        <p className="text-red-500">
          {form.formState.errors.keyword.message}
        </p>
      )}
      <Button type="submit">Save</Button>
    </form>
  );
}
```

### Toast Notifications

```javascript
import { toast } from 'sonner';

// Success
toast.success('Keyword created successfully');

// Error
toast.error('Failed to create keyword');

// Loading (returns dismiss function)
const toastId = toast.loading('Creating keyword...');
// Later: toast.dismiss(toastId);

// Promise-based
toast.promise(
  Keyword.create({ keyword: 'test' }),
  {
    loading: 'Creating...',
    success: 'Created!',
    error: 'Failed'
  }
);
```

### Styling with cn()

```javascript
import { cn } from '@/lib/utils';

function MyComponent({ className, variant }) {
  return (
    <div className={cn(
      "base-classes px-4 py-2",
      variant === 'primary' && "bg-blue-500 text-white",
      variant === 'secondary' && "bg-gray-200 text-black",
      className
    )}>
      Content
    </div>
  );
}
```

## Article Generation Wizard

The main content creation component in `wizard/ArticleGenerationWizard.jsx` (544 lines).

### Usage

```javascript
import ArticleGenerationWizard from '@/components/wizard/ArticleGenerationWizard';

function MyPage() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setWizardOpen(true)}>
        Generate Article
      </Button>

      <ArticleGenerationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        preSelectedTopic={null}  // Optional
      />
    </>
  );
}
```

### Wizard Steps

1. **Select Topic** - Choose from 20+ AI suggestions (4 sources)
2. **Select Type** - Choose article type (Ranking, Guide, Listicle, etc.)
3. **Select Title** - Pick from 5 AI-generated titles
4. **Generation** - Real-time progress visualization
5. **Success** - View article or go to review queue

### Article Types

- **Ranking Article** (🏆) - Best programs, top schools
- **Career Guide** (💼) - Career paths, salaries
- **Listicle** (📝) - Tips, strategies
- **Comprehensive Guide** (📚) - In-depth content
- **FAQ Article** (❓) - Q&A format

## Routing

Routes are defined in `src/pages/Pages.jsx`:

**V1 Routes (`/v1/*`):**
- `/v1/` - Dashboard
- `/v1/keywords` - Keyword Manager
- `/v1/content` - Content Library
- `/v1/approvals` - Approval Queue
- `/v1/ai-agents` - AI Agents
- `/v1/performance` - Analytics
- `/v1/ai-training` - AI Training
- `/v1/wordpress` - WordPress
- `/v1/settings` - Settings
- `/v1/topic-discovery` - Topics
- `/v1/site-analysis` - Site Analysis

**V2 Routes (`/v2/*`):**
- `/v2/` - Dashboard
- `/v2/approval` - Approval Queue
- `/v2/topics` - Topic Manager
- `/v2/settings` - Settings

**Navigation:**
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/v1/keywords');
```

## Dialog Pattern

```javascript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

function MyDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          Content here
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Table Pattern

```javascript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function DataTable({ data }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Badge variant={item.status}>
                {item.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Animation with Framer Motion

```javascript
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedList({ items }) {
  return (
    <AnimatePresence>
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {item.content}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

## Best Practices

1. **Use path aliases** - `@/components/ui/button`
2. **Cleanup subscriptions** - Always in useEffect return
3. **Handle loading states** - Show Skeleton components
4. **Validate forms** - Use zod schemas
5. **Show feedback** - Toast for all actions
6. **Use cn() for styling** - Conditional classes
7. **Keep components small** - Extract reusable parts
