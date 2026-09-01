import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  ChartIncreaseIcon,
  CheckIcon,
  CommandIcon,
  Copy01Icon,
  DashboardSquare01Icon,
  Database02Icon,
  Delete02Icon,
  FloppyDiskIcon,
  Globe02Icon,
  HelpCircleIcon,
  Home03Icon,
  Link01Icon,
  Megaphone02Icon,
  Message02Icon,
  MinusSignIcon,
  Notification01Icon,
  QuoteDownIcon,
  Search01Icon,
  Settings01Icon,
  Timer02Icon,
  ToolsIcon,
  UserGroupIcon,
  BotIcon,
} from "@hugeicons/core-free-icons";

const icons = {
  add: Add01Icon,
  arrowDown: ArrowDown01Icon,
  arrowRight: ArrowRight01Icon,
  external: ArrowUpRight01Icon,
  chart: ChartIncreaseIcon,
  check: CheckIcon,
  command: CommandIcon,
  copy: Copy01Icon,
  dashboard: DashboardSquare01Icon,
  database: Database02Icon,
  delete: Delete02Icon,
  globe: Globe02Icon,
  home: Home03Icon,
  megaphone: Megaphone02Icon,
  message: Message02Icon,
  bot: BotIcon,
  save: FloppyDiskIcon,
  help: HelpCircleIcon,
  link: Link01Icon,
  minus: MinusSignIcon,
  notification: Notification01Icon,
  quote: QuoteDownIcon,
  search: Search01Icon,
  settings: Settings01Icon,
  timer: Timer02Icon,
  tools: ToolsIcon,
  users: UserGroupIcon,
} as const;

export type ControlIconName = keyof typeof icons;

export function ControlIcon({ name, size = 18, strokeWidth = 1.8, className }: {
  name: ControlIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return <HugeiconsIcon icon={icons[name]} size={size} strokeWidth={strokeWidth} color="currentColor" className={className} aria-hidden="true" />;
}
