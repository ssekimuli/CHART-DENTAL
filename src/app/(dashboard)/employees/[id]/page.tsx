
"use client";

import { notFound, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getEmployeeById } from '@/lib/api';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [employee, setEmployee] = useState<Employee | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') return;
    const fetchData = async () => {
        setIsLoading(true);
        const data = await getEmployeeById(id);
        setEmployee(data);
        setIsLoading(false);
    }
    fetchData();
  }, [id]);
  
  if (isLoading) {
      return (
          <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => router.back()}>
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Back</span>
                  </Button>
                  <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Loading Employee...
                  </h1>
              </div>
              <Card>
                  <CardHeader className="flex flex-row items-center gap-4">
                      <Avatar className="h-24 w-24 border">
                          <AvatarFallback></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                           <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                           <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
              </Card>
          </div>
      )
  }

  if (!employee) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Employee Details
        </h1>
      </div>
        <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-24 w-24 border">
                <AvatarImage src={employee.avatar} />
                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <CardTitle className="text-3xl">{employee.name}</CardTitle>
                <CardDescription className="text-base text-muted-foreground">{employee.email}</CardDescription>
                <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">{employee.role}</Badge>
                    <Badge
                        variant={employee.status === "Active" ? "secondary" : "outline"}
                        className={employee.status === 'Active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : ''}
                        >
                        {employee.status}
                    </Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="grid gap-1">
                    <span className="text-muted-foreground">Hire Date</span>
                    <span className="font-medium">{employee.hireDate}</span>
                </div>
                <div className="grid gap-1">
                    <span className="text-muted-foreground">Salary</span>
                    <span className="font-medium">${employee.salary.toLocaleString()}</span>
                </div>
                 <div className="grid gap-1">
                    <span className="text-muted-foreground">Branch ID</span>
                    <span className="font-medium">{employee.branchId}</span>
                </div>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
