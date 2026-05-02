export const site = {
  zhName: "异环手账",
  enName: "NTE Notes",
  description: "面向 NTE（异环）玩家的轻量资料、术语与中英对照手账。",
  nav: [
    { href: "/", label: "首页" },
    { href: "/tasks/", label: "海市事务" },
    { href: "/bugs/", label: "Bug 收集" },
    { href: "/characters/", label: "角色信息" },
    { href: "/affinity/", label: "好感度" },
    { href: "/terms/", label: "名词解释" },
    { href: "/translations/", label: "中英对照" },
    { href: "/links/", label: "外部链接" },
    { href: "/about/", label: "关于" },
  ],
};

export function withBase(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path === "/") return `${base}/`;
  return `${base}${path}`;
}
