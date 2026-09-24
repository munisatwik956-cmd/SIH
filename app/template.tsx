export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
body{background:#f5f2ec!important;color:#172334!important;background-image:linear-gradient(rgba(23,35,52,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(23,35,52,.028) 1px,transparent 1px)!important;background-size:28px 28px!important}.orb{display:none!important}.liquid{background:rgba(255,255,255,.74)!important;border:0!important;box-shadow:0 1px 0 rgba(255,255,255,.96) inset,0 0 0 1px rgba(23,35,52,.08),0 18px 42px rgba(36,48,65,.055)!important;backdrop-filter:none!important}.liquid:hover{transform:translateY(-2px)!important;box-shadow:0 1px 0 rgba(255,255,255,.96) inset,0 0 0 1px rgba(23,35,52,.13),0 22px 48px rgba(36,48,65,.08)!important}@media(prefers-reduced-motion:reduce){.liquid:hover{transform:none!important}}
`}</style>
      {children}
    </>
  );
}
