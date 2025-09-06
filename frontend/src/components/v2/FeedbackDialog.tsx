import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  triggerLabel: string;
  onSubmit: (feedback: string) => void;
}

export const FeedbackDialog: React.FC<Props> = ({ triggerLabel, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    onSubmit(feedback);
    setFeedback('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provide Feedback</DialogTitle>
        </DialogHeader>
        <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Your feedback" className="mb-4" />
        <Button onClick={handleSubmit} disabled={!feedback.trim()}>Submit</Button>
      </DialogContent>
    </Dialog>
  );
};
