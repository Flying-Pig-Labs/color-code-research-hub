import { useState, KeyboardEvent } from "react";
import { Input } from "./input";
import { Badge } from "./badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagsInput = ({ value, onChange, placeholder = "Type and press Enter", className }: TagsInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={cn("min-h-10 border border-input rounded-md p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-sm">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
};