import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarDays, Target, Heart,
  Sparkles, TrendingUp, PiggyBank, Flower2, Settings, Clock,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Planejamento", url: "/planejamento", icon: CalendarDays },
  { title: "Grandes Metas", url: "/metas", icon: Target },
  { title: "Linha do Tempo", url: "/linha-do-tempo", icon: Clock },
];

const growthItems = [
  { title: "Carta para Mim", url: "/carta", icon: Heart },
  { title: "Quem Quero Me Tornar", url: "/quem-quero-me-tornar", icon: Sparkles },
  { title: "Evolução Anual", url: "/evolucao", icon: TrendingUp },
];

const lifeItems = [
  { title: "Desafio Financeiro", url: "/desafio-financeiro", icon: PiggyBank },
  { title: "Momentos", url: "/momentos", icon: Flower2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-lilac grid place-items-center text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-semibold text-primary">Serenity</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Crescimento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {growthItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Vida</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lifeItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações" isActive={isActive("/configuracoes")}>
              <Link to="/configuracoes"><Settings /><span>Configurações</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
