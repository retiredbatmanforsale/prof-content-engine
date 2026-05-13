import React, { type ReactNode } from 'react';
import {
  BookOpen,
  Brain,
  Bot,
  Code2,
  Compass,
  Eye,
  GraduationCap,
  Layers,
  LineChart,
  Microscope,
  Network,
  PlayCircle,
  Server,
  Sparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  network: Network,
  eye: Eye,
  waves: Waves,
  sparkles: Sparkles,
  bot: Bot,
  server: Server,
  briefcase: GraduationCap,
  microscope: Microscope,
  compass: Compass,
  'book-open': BookOpen,
  code: Code2,
  layers: Layers,
  chart: LineChart,
  play: PlayCircle,
};

const ICON_SIZE = 14;

export default function SidebarIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}): ReactNode {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return (
    <span className={className} aria-hidden="true">
      <Icon size={ICON_SIZE} strokeWidth={1.75} />
    </span>
  );
}
