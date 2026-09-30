import {
  Award, BadgeCheck, Bed, BookOpen, Briefcase, Building2, Calendar, ChartColumn, Cpu, Download, FileText, House, KanbanSquare, Layers,
  List, Plus, ScanLine, Shield, User, UserPlus, Users, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  home: House, calendar: Calendar, scan: ScanLine, award: Award, briefcase: Briefcase, download: Download, user: User, book: BookOpen,
  chart: ChartColumn, layers: Layers, bed: Bed, users: Users, cpu: Cpu, file: FileText, building: Building2, badge: BadgeCheck,
  shield: Shield, list: List, userPlus: UserPlus, kanban: KanbanSquare, plus: Plus,
};
