interface PageHeaderProps { title: string; subtitle?: string; action?: React.ReactNode }
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-12 pb-4">
      <div>
        <h1 className="text-xl font-semibold text-[#E8ECE8] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#555D55] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
