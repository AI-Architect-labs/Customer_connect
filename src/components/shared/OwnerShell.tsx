'use client';
import type{ReactNode}from'react';import{usePathname}from'next/navigation';import{RequireOwner}from'@/features/auth';import{OwnerNav}from'./OwnerNav';
export function OwnerShell({children}:{children:ReactNode}){const path=usePathname();if(path==='/login')return <>{children}</>;return <RequireOwner redirectTo="/login"><div className="min-h-screen md:flex"><OwnerNav/><main className="min-w-0 flex-1 bg-muted/30 p-4 md:p-6">{children}</main></div></RequireOwner>;}
